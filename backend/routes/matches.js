const express = require('express');
const pool = require('../db/connection');
const { fetchHeadToHead, fetchTeamMatches } = require('../services/footballApi');
const { generateAnalysis } = require('../services/aiService');
const { computeForm, computeH2hSummary, computeStatisticalPrediction } = require('../services/statsService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/matches/:matchId/h2h
router.get('/matches/:matchId/h2h', authMiddleware, async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  try {
    const h2h = await fetchHeadToHead(matchId);
    res.json(h2h);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch H2H data' });
  }
});

// GET /api/matches/:matchId/prediction
router.get('/matches/:matchId/prediction', authMiddleware, async (req, res) => {
  const matchId = parseInt(req.params.matchId);

  try {
    // Check prediction cache in DB
    const cached = await pool.query('SELECT data FROM predictions WHERE match_id = $1', [matchId]);
    if (cached.rows.length > 0) {
      return res.json(cached.rows[0].data);
    }

    // Fetch H2H to find home/away teams
    const h2hData = await fetchHeadToHead(matchId);
    const h2hMatches = h2hData.matches || [];

    if (h2hMatches.length === 0) {
      return res.status(404).json({ error: 'Match not found. Load team data first.' });
    }

    // Determine teams from most recent H2H match (aggregates)
    const agg = h2hData.aggregates || {};
    const homeTeamName = agg.homeTeam?.name || h2hMatches[0]?.home_team || 'Home Team';
    const awayTeamName = agg.awayTeam?.name || h2hMatches[0]?.away_team || 'Away Team';
    const homeTeamId = agg.homeTeam?.id;
    const awayTeamId = agg.awayTeam?.id;

    const [homeForm, awayForm] = await Promise.all([
      homeTeamId ? fetchTeamMatches(homeTeamId, 'FINISHED', 10) : [],
      awayTeamId ? fetchTeamMatches(awayTeamId, 'FINISHED', 10) : [],
    ]);

    const competition = agg.numberOfMatches > 0 ? (h2hMatches[0]?.competition || 'Unknown') : 'Unknown';

    const homeStats = computeForm(homeForm, homeTeamName);
    const awayStats = computeForm(awayForm, awayTeamName);
    const h2hSummary = computeH2hSummary(h2hMatches, homeTeamName, awayTeamName);

    // Step 1: compute all numbers statistically
    const statPrediction = computeStatisticalPrediction(homeStats, awayStats, h2hSummary);

    // Step 2: use AI only for textual analysis
    const analysis = await generateAnalysis(
      homeTeamName, awayTeamName, homeStats, awayStats, h2hSummary, statPrediction, competition
    );

    const homeCrest = homeTeamId ? `https://crests.football-data.org/${homeTeamId}.png` : '';
    const awayCrest = awayTeamId ? `https://crests.football-data.org/${awayTeamId}.png` : '';

    const result = {
      ...statPrediction,
      ...analysis,
      home_team: { id: homeTeamId, name: homeTeamName, crest: homeCrest },
      away_team: { id: awayTeamId, name: awayTeamName, crest: awayCrest },
      home_stats: homeStats,
      away_stats: awayStats,
      h2h_summary: h2hSummary,
      h2h_matches: h2hMatches.slice(0, 10),
    };

    // Cache in DB
    await pool.query(
      'INSERT INTO predictions (match_id, data) VALUES ($1, $2) ON CONFLICT (match_id) DO UPDATE SET data = EXCLUDED.data',
      [matchId, JSON.stringify(result)]
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

module.exports = router;
