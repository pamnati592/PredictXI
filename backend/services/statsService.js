// Dixon-Coles exponential time decay: xi=0.0065 per day (from original paper)
// φ(t) = exp(-ξ * days_ago) — recent matches get weight ~1.0, 3-month-old match ~0.55
const DECAY_XI = 0.0065;

// Competition quality coefficients — based on official UEFA Country Coefficients 2025/26
// Source: soccer365.net/ranking/uefa/
// Formula: country_points / england_points (115.630)
// Only leagues available via football-data.org API + UEFA club competitions are listed.
// Teams play in these competitions too (CL/EL/ECL) so their form data may include those matches.
const COMPETITION_QUALITY = {
  // ── Leagues available in football-data.org API ───────────────────────────
  'Premier League':                 1.00,  // England   115.630 (rank 1)
  'Championship':                   0.70,  // England second tier (estimated ~70% of PL)
  'Serie A':                        0.86,  // Italy      99.660 (rank 2)
  'La Liga':                        0.82,  // Spain      95.234 (rank 3)
  'Bundesliga':                     0.78,  // Germany    90.545 (rank 4)
  'Ligue 1':                        0.71,  // France     81.569 (rank 5)
  'Primeira Liga':                  0.62,  // Portugal   71.566 (rank 6)
  'Eredivisie':                     0.59,  // Netherlands 67.762 (rank 7)
  'Brasileirão Série A':            0.65,  // Brazil — CONMEBOL, estimated
  'Copa Libertadores':              0.72,  // CONMEBOL elite, estimated

  // ── UEFA club competitions (teams from above leagues participate) ─────────
  'UEFA Champions League':          1.10,  // Best clubs from top leagues
  'Champions League':               1.10,
  'UEFA Europa League':             0.95,
  'Europa League':                  0.95,
  'UEFA Conference League':         0.82,
  'Conference League':              0.82,

  // ── Default for any other competition not listed ──────────────────────────
  '_default': 0.60,
};

function competitionQuality(competitionName) {
  if (!competitionName) return COMPETITION_QUALITY['_default'];
  // Try exact match first
  if (COMPETITION_QUALITY[competitionName]) return COMPETITION_QUALITY[competitionName];
  // Try partial match (handles slight name variations)
  const lower = competitionName.toLowerCase();
  for (const [key, val] of Object.entries(COMPETITION_QUALITY)) {
    if (key !== '_default' && lower.includes(key.toLowerCase())) return val;
  }
  return COMPETITION_QUALITY['_default'];
}

function timeWeight(dateStr) {
  if (!dateStr) return 0.5;
  const daysAgo = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-DECAY_XI * daysAgo);
}

function computeForm(matches, teamName) {
  let wins = 0, draws = 0, losses = 0;
  let homeWins = 0, homePlayed = 0, awayWins = 0, awayPlayed = 0;
  let cleanSheets = 0;
  const formString = [];
  const last5 = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };

  // Weighted accumulators (Dixon-Coles time decay)
  let wGoalsFor = 0, wGoalsAgainst = 0, wTotal = 0;

  let idx = 0;
  for (const m of matches) {
    if (m.status !== 'FINISHED') continue;
    const homeG = m.score?.home;
    const awayG = m.score?.away;
    if (homeG == null || awayG == null) continue;

    const isHome = m.home_team.name === teamName;
    const teamG = isHome ? homeG : awayG;
    const oppG = isHome ? awayG : homeG;

    // Combined weight: time decay (Dixon-Coles) × competition quality
    // e.g. Israeli league match from 2 months ago: 0.72 × 0.52 = 0.37
    // vs PL match from last week: 0.96 × 1.0 = 0.96
    const w = timeWeight(m.date) * competitionQuality(m.competition);
    wGoalsFor += teamG * w;
    wGoalsAgainst += oppG * w;
    wTotal += w;

    if (oppG === 0) cleanSheets++;
    if (isHome) { homePlayed++; if (teamG > oppG) homeWins++; }
    else { awayPlayed++; if (teamG > oppG) awayWins++; }

    let result;
    if (teamG > oppG) { wins++; result = 'W'; }
    else if (teamG === oppG) { draws++; result = 'D'; }
    else { losses++; result = 'L'; }
    formString.push(result);

    if (idx < 5) {
      if (result === 'W') last5.wins++;
      else if (result === 'D') last5.draws++;
      else last5.losses++;
      last5.goalsFor += teamG;
      last5.goalsAgainst += oppG;
    }
    idx++;
  }

  const total = wins + draws + losses;
  const last5Total = last5.wins + last5.draws + last5.losses;

  return {
    played: total,
    wins, draws, losses,
    goal_diff: (wTotal > 0 ? wGoalsFor : 0) - (wTotal > 0 ? wGoalsAgainst : 0),
    points: wins * 3 + draws,
    win_rate: total > 0 ? Math.round((wins / total) * 1000) / 10 : 0,
    draw_rate: total > 0 ? Math.round((draws / total) * 1000) / 10 : 0,
    form_string: formString.slice(0, 5),
    // Time-weighted averages (Dixon-Coles) — recent matches count more
    avg_goals_scored: wTotal > 0 ? Math.round((wGoalsFor / wTotal) * 100) / 100 : 0,
    avg_goals_conceded: wTotal > 0 ? Math.round((wGoalsAgainst / wTotal) * 100) / 100 : 0,
    clean_sheets: cleanSheets,
    home_win_rate: homePlayed > 0 ? Math.round((homeWins / homePlayed) * 100) : 0,
    away_win_rate: awayPlayed > 0 ? Math.round((awayWins / awayPlayed) * 100) : 0,
    home_played: homePlayed,
    away_played: awayPlayed,
    last5: {
      wins: last5.wins, draws: last5.draws, losses: last5.losses,
      avg_goals_scored: last5Total > 0 ? Math.round((last5.goalsFor / last5Total) * 100) / 100 : 0,
      avg_goals_conceded: last5Total > 0 ? Math.round((last5.goalsAgainst / last5Total) * 100) / 100 : 0,
      points: last5.wins * 3 + last5.draws,
      // Momentum: last5 points vs expected (if same win rate)
      momentum_score: last5.wins * 3 + last5.draws, // out of 15
    },
  };
}

// Compute statistical prediction using Dixon-Coles inspired xG model
// Research sources:
//   - Dixon & Coles (1997): time-decay + attack/defense rating
//   - Home advantage: ~45% home win rate (Premier League, modern era)
//   - Home xG boost: +0.35 goals per game for playing at home
function computeStatisticalPrediction(homeStats, awayStats, h2hSummary) {
  const h2hTotal = h2hSummary.total_matches;

  // H2H weight: grows with sample size, capped at 40%
  const h2hWeight = Math.min(h2hTotal, 8) / 20;
  const formWeight = 1 - h2hWeight;

  const h2hAvgHome = h2hTotal > 0 ? h2hSummary.home_team_goals / h2hTotal : null;
  const h2hAvgAway = h2hTotal > 0 ? h2hSummary.away_team_goals / h2hTotal : null;

  // Time-weighted attack/defense (already computed with Dixon-Coles decay in computeForm)
  const homeAttack = homeStats.avg_goals_scored || 1.2;
  const homeDefense = homeStats.avg_goals_conceded || 1.2;
  const awayAttack = awayStats.avg_goals_scored || 1.0;
  const awayDefense = awayStats.avg_goals_conceded || 1.2;

  // Momentum boost: if last5 >> overall, team is in form (max ±0.15 xG adjustment)
  const homeMomentumRatio = homeStats.played > 0 && homeStats.last5?.avg_goals_scored != null
    ? homeStats.last5.avg_goals_scored / (homeStats.avg_goals_scored || 1) : 1;
  const awayMomentumRatio = awayStats.played > 0 && awayStats.last5?.avg_goals_scored != null
    ? awayStats.last5.avg_goals_scored / (awayStats.avg_goals_scored || 1) : 1;
  const homeMomentumBoost = Math.max(-0.15, Math.min(0.15, (homeMomentumRatio - 1) * 0.3));
  const awayMomentumBoost = Math.max(-0.15, Math.min(0.15, (awayMomentumRatio - 1) * 0.3));

  // Quality ratio: away attack vs home attack (used for both xG and probability adjustments)
  // e.g. Arsenal (2.15 avg) visiting Sporting (1.2 avg) → ratio = 2.15/1.2 = 1.79
  const qualityRatio = (awayAttack > 0 && homeAttack > 0) ? awayAttack / homeAttack : 1;

  // xG base: Dixon-Coles formula — attack × opponent_defense / league_avg
  const leagueAvg = (homeAttack + awayAttack) / 2;
  let xgHome = (homeAttack * awayDefense) / leagueAvg;
  let xgAway = (awayAttack * homeDefense) / leagueAvg;

  // Apply momentum
  xgHome += homeMomentumBoost;
  xgAway += awayMomentumBoost;

  // Home advantage: +0.35 xG base, reduced when away team is significantly stronger
  const xgHomeBoost = Math.max(0.05, 0.35 - (qualityRatio - 1) * 0.15);
  xgHome += xgHomeBoost;

  // Blend with H2H if available
  if (h2hAvgHome !== null) {
    xgHome = xgHome * formWeight + h2hAvgHome * h2hWeight;
    xgAway = xgAway * formWeight + h2hAvgAway * h2hWeight;
  }

  xgHome = Math.max(0.2, xgHome);
  xgAway = Math.max(0.2, xgAway);

  // Round xG to nearest integer for predicted score (realistic)
  const predictedHome = Math.round(xgHome);
  const predictedAway = Math.round(xgAway);

  // Win probabilities: combine form rates + home advantage correction + H2H
  const homeFormWin = homeStats.played > 0 ? homeStats.wins / homeStats.played : 0.38;
  const homeFormDraw = homeStats.played > 0 ? homeStats.draws / homeStats.played : 0.25;
  const awayFormWin = awayStats.played > 0 ? awayStats.wins / awayStats.played : 0.30;
  const awayFormDraw = awayStats.played > 0 ? awayStats.draws / awayStats.played : 0.25;

  // homeBoost: full +8% when equal teams, shrinks as away is stronger
  const homeBoost = Math.max(-0.05, 0.08 - (qualityRatio - 1) * 0.07);
  const awayPenalty = Math.max(-0.05, 0.05 - (qualityRatio - 1) * 0.04);

  const homeAdjWin = Math.min(0.85, homeFormWin + homeBoost);
  const awayAdjWin = Math.max(0.05, awayFormWin - awayPenalty);
  const avgDraw = (homeFormDraw + awayFormDraw) / 2;

  const h2hHomeWin = h2hTotal > 0 ? h2hSummary.home_team_wins / h2hTotal : null;
  const h2hDraw    = h2hTotal > 0 ? h2hSummary.draws / h2hTotal : null;
  const h2hAwayWin = h2hTotal > 0 ? h2hSummary.away_team_wins / h2hTotal : null;

  let rawHome, rawDraw, rawAway;
  if (h2hHomeWin !== null) {
    rawHome = homeAdjWin * formWeight + h2hHomeWin * h2hWeight;
    rawDraw  = avgDraw  * formWeight + h2hDraw    * h2hWeight;
    rawAway = awayAdjWin * formWeight + h2hAwayWin * h2hWeight;
  } else {
    rawHome = homeAdjWin;
    rawDraw  = avgDraw;
    rawAway = awayAdjWin;
  }

  // Normalize to 100
  const rawTotal = rawHome + rawDraw + rawAway;
  let homeProb = Math.round((rawHome / rawTotal) * 100);
  let awayProb = Math.round((rawAway / rawTotal) * 100);
  let drawProb = 100 - homeProb - awayProb;

  // Research: draws occur in 25-28% of professional football matches.
  // Enforce a minimum of 20% draw probability unless teams are very unevenly matched.
  const drawFloor = (Math.abs(homeProb - awayProb) > 35) ? 15 : 20;
  if (drawProb < drawFloor) {
    const deficit = drawFloor - drawProb;
    drawProb = drawFloor;
    // Take equally from home and away
    const fromHome = Math.ceil(deficit / 2);
    const fromAway = Math.floor(deficit / 2);
    homeProb = Math.max(5, homeProb - fromHome);
    awayProb = Math.max(5, awayProb - fromAway);
  }

  // Confidence: based on data points available
  const dataPoints = homeStats.played + awayStats.played + h2hTotal;
  const confidence = dataPoints >= 25 ? 'high' : dataPoints >= 12 ? 'medium' : 'low';

  return {
    home_win_probability: homeProb,
    draw_probability: Math.max(0, drawProb),
    away_win_probability: awayProb,
    predicted_score: `${predictedHome}-${predictedAway}`,
    confidence,
    xg_home: Math.round(xgHome * 100) / 100,
    xg_away: Math.round(xgAway * 100) / 100,
  };
}

function computeH2hSummary(h2hMatches, homeTeam, awayTeam) {
  let homeWins = 0, awayWins = 0, draws = 0, homeGoals = 0, awayGoals = 0;

  for (const m of h2hMatches) {
    if (m.home_score == null || m.away_score == null) continue;
    const h = m.home_team === homeTeam ? m.home_score : m.away_score;
    const a = m.home_team === homeTeam ? m.away_score : m.home_score;

    homeGoals += h;
    awayGoals += a;
    if (h > a) homeWins++;
    else if (h === a) draws++;
    else awayWins++;
  }

  return {
    total_matches: homeWins + draws + awayWins,
    home_team_wins: homeWins,
    draws,
    away_team_wins: awayWins,
    home_team_goals: homeGoals,
    away_team_goals: awayGoals,
  };
}

module.exports = { computeForm, computeH2hSummary, computeStatisticalPrediction };
