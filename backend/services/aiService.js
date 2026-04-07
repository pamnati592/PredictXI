const axios = require('axios');

function buildAnalysisPrompt(homeTeam, awayTeam, homeStats, awayStats, h2hSummary, statPrediction, competition) {
  const h2nAvgHome = h2hSummary.total_matches > 0
    ? (h2hSummary.home_team_goals / h2hSummary.total_matches).toFixed(2) : 'N/A';
  const h2hAvgAway = h2hSummary.total_matches > 0
    ? (h2hSummary.away_team_goals / h2hSummary.total_matches).toFixed(2) : 'N/A';

  const momentum = (stats) => {
    const pts = stats.last5?.points ?? '?';
    const f = stats.form_string?.join('') || '?????';
    return `${pts}/15 pts in last 5 (${f})`;
  };

  return `You are an expert football data analyst. You will receive full statistical data for an upcoming match and a base model prediction. The statistics have already been adjusted for competition quality (e.g. goals in the Israeli league count less than goals in the Premier League, Champions League goals count more). Your job is to deeply analyze ALL the data and decide if the base prediction should be adjusted — then output the FINAL prediction with explanation.

Match: ${homeTeam} (Home) vs ${awayTeam} (Away)
Competition: ${competition}

=== ${homeTeam} — FULL STATS (last 10 matches) ===
Overall: ${homeStats.wins}W ${homeStats.draws}D ${homeStats.losses}L
Avg goals scored: ${homeStats.avg_goals_scored} | Avg conceded: ${homeStats.avg_goals_conceded}
Clean sheets: ${homeStats.clean_sheets}/${homeStats.played}
Home record (all data): ${homeStats.home_win_rate}% win rate (${homeStats.home_played} home games)
Momentum: ${momentum(homeStats)}
Last 5 avg scored: ${homeStats.last5?.avg_goals_scored} | Last 5 avg conceded: ${homeStats.last5?.avg_goals_conceded}

=== ${awayTeam} — FULL STATS (last 10 matches) ===
Overall: ${awayStats.wins}W ${awayStats.draws}D ${awayStats.losses}L
Avg goals scored: ${awayStats.avg_goals_scored} | Avg conceded: ${awayStats.avg_goals_conceded}
Clean sheets: ${awayStats.clean_sheets}/${awayStats.played}
Away record (all data): ${awayStats.away_win_rate}% win rate (${awayStats.away_played} away games)
Momentum: ${momentum(awayStats)}
Last 5 avg scored: ${awayStats.last5?.avg_goals_scored} | Last 5 avg conceded: ${awayStats.last5?.avg_goals_conceded}

=== HEAD TO HEAD (last ${h2hSummary.total_matches} meetings) ===
${homeTeam} wins: ${h2hSummary.home_team_wins} | Draws: ${h2hSummary.draws} | ${awayTeam} wins: ${h2hSummary.away_team_wins}
Avg goals per game: ${homeTeam} ${h2nAvgHome} / ${awayTeam} ${h2hAvgAway}

=== BASE MODEL PREDICTION (from xG formula) ===
Predicted score: ${statPrediction.predicted_score}
${homeTeam} win: ${statPrediction.home_win_probability}% | Draw: ${statPrediction.draw_probability}% | ${awayTeam} win: ${statPrediction.away_win_probability}%
xG Home: ${statPrediction.xg_home} | xG Away: ${statPrediction.xg_away}

=== YOUR TASK ===
Consider all of the above including:
- Home advantage (home teams historically win ~46% of matches)
- Momentum trend (last 5 vs last 10)
- Defensive strength (clean sheets, avg conceded)
- Away team's away record specifically
- H2H patterns
- Whether teams are evenly matched (increases draw probability)

IMPORTANT CONTEXT: In professional football, the historical draw rate is 25-28%. A "low" draw probability is below 20%, "average" is 25-28%, "high" is above 30%. Never describe a probability below 22% as "average" — it is below average.

You MAY adjust the probabilities and predicted score from the base model if the data justifies it. Keep adjustments data-driven — max ±15% shift from base model probabilities. The three probabilities must sum to exactly 100. The draw probability should not go below 15% unless the teams are extremely mismatched.

Respond in JSON only:
{
  "home_win_probability": <integer 0-100>,
  "draw_probability": <integer 0-100>,
  "away_win_probability": <integer 0-100>,
  "predicted_score": "<home>-<away>",
  "confidence": "<low|medium|high>",
  "key_factors": ["<factor with actual numbers>", "<factor with actual numbers>", "<factor with actual numbers>"],
  "reasoning": "<3-4 sentences in Hebrew explaining your analysis and any adjustments made>"
}`;
}

async function generateAnalysis(homeTeam, awayTeam, homeStats, awayStats, h2hSummary, statPrediction, competition) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      ...statPrediction,
      key_factors: ['No API key configured'],
      reasoning: 'לא הוגדר GROQ_API_KEY.',
    };
  }

  const prompt = buildAnalysisPrompt(homeTeam, awayTeam, homeStats, awayStats, h2hSummary, statPrediction, competition);

  const { data } = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 768,
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  let text = data.choices[0].message.content.trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}') + 1;
  if (start >= 0 && end > start) text = text.slice(start, end);

  const parsed = JSON.parse(text);

  // Ensure probabilities sum to 100
  const total = (parsed.home_win_probability || 0) + (parsed.draw_probability || 0) + (parsed.away_win_probability || 0);
  if (Math.abs(total - 100) > 2) {
    // fallback to stat prediction numbers if AI returned bad sum
    parsed.home_win_probability = statPrediction.home_win_probability;
    parsed.draw_probability = statPrediction.draw_probability;
    parsed.away_win_probability = statPrediction.away_win_probability;
    parsed.predicted_score = statPrediction.predicted_score;
  }

  return parsed;
}

module.exports = { generateAnalysis };
