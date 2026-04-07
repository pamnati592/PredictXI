const express = require('express');
const { fetchLeagues, fetchTeamsForLeague, fetchTeamMatches, fetchLeagueStandings, SUPPORTED_LEAGUES } = require('../services/footballApi');
const { computeForm } = require('../services/statsService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/leagues
router.get('/leagues', authMiddleware, async (req, res) => {
  try {
    const leagues = await fetchLeagues();
    res.json(leagues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

// GET /api/teams?league_code=PL
router.get('/teams', authMiddleware, async (req, res) => {
  const { league_code } = req.query;
  if (!league_code) return res.status(400).json({ error: 'league_code is required' });

  try {
    const teams = await fetchTeamsForLeague(league_code);
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// GET /api/teams/:teamId/form
router.get('/teams/:teamId/form', authMiddleware, async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  try {
    const matches = await fetchTeamMatches(teamId, 'FINISHED', 10);
    // Determine team name from first match
    let teamName = String(teamId);
    for (const m of matches) {
      if (m.home_team.id === teamId) { teamName = m.home_team.name; break; }
      if (m.away_team.id === teamId) { teamName = m.away_team.name; break; }
    }
    const stats = computeForm(matches, teamName);
    res.json({ team_id: teamId, team_name: teamName, stats, matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch team form' });
  }
});

// GET /api/teams/:teamId/upcoming
router.get('/teams/:teamId/upcoming', authMiddleware, async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  try {
    const matches = await fetchTeamMatches(teamId, 'SCHEDULED', 5);
    res.json({ team_id: teamId, matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch upcoming matches' });
  }
});

// GET /api/leagues/:code/table
router.get('/leagues/:code/table', authMiddleware, async (req, res) => {
  const { code } = req.params;
  if (!SUPPORTED_LEAGUES[code]) return res.status(404).json({ error: 'League not found' });
  try {
    const standings = await fetchLeagueStandings(code);
    res.json(standings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch league table' });
  }
});

module.exports = router;
