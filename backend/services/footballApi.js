const axios = require('axios');
const pool = require('../db/connection');

const BASE_URL = 'https://api.football-data.org/v4';

const SUPPORTED_LEAGUES = {
  PL:  { name: 'Premier League',       country: 'England' },
  ELC: { name: 'Championship',          country: 'England' },
  PD:  { name: 'La Liga',               country: 'Spain' },
  BL1: { name: 'Bundesliga',            country: 'Germany' },
  SA:  { name: 'Serie A',               country: 'Italy' },
  FL1: { name: 'Ligue 1',               country: 'France' },
  DED: { name: 'Eredivisie',            country: 'Netherlands' },
  PPL: { name: 'Primeira Liga',         country: 'Portugal' },
  BSA: { name: 'Brasileirão Série A',   country: 'Brazil' },
  CL:  { name: 'Champions League',      country: 'Europe' },
  CLI: { name: 'Copa Libertadores',     country: 'South America' },
};

function getHeaders() {
  return { 'X-Auth-Token': process.env.FOOTBALL_API_KEY || '' };
}

async function getCache(key) {
  const res = await pool.query(
    'SELECT data FROM api_cache WHERE cache_key = $1 AND expires_at > NOW()',
    [key]
  );
  return res.rows.length > 0 ? res.rows[0].data : null;
}

async function setCache(key, data, hours = 1) {
  await pool.query(
    `INSERT INTO api_cache (cache_key, data, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' hours')::interval)
     ON CONFLICT (cache_key) DO UPDATE
       SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`,
    [key, JSON.stringify(data), hours]
  );
}

async function fetchLeagues() {
  return Object.entries(SUPPORTED_LEAGUES).map(([code, info]) => ({
    code,
    name: info.name,
    country: info.country,
    emblem_url: `https://crests.football-data.org/${code}.png`,
  }));
}

async function fetchTeamsForLeague(leagueCode) {
  const cacheKey = `teams_${leagueCode}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const token = process.env.FOOTBALL_API_KEY;
  if (!token) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/competitions/${leagueCode}/teams`, {
      headers: getHeaders(),
      timeout: 10000,
    });

    const teams = (data.teams || []).map((t) => ({
      id: t.id,
      name: t.name,
      short_name: t.shortName || t.name,
      crest_url: t.crest || '',
      country: t.area?.name || '',
    }));

    await setCache(cacheKey, teams, 12);
    return teams;
  } catch (err) {
    console.error('API error fetching teams:', err.message);
    return [];
  }
}

async function fetchTeamMatches(teamId, status = 'FINISHED', limit = 10) {
  const cacheKey = `matches_${teamId}_${status}_${limit}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const token = process.env.FOOTBALL_API_KEY;
  if (!token) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/teams/${teamId}/matches`, {
      headers: getHeaders(),
      params: { status, limit },
      timeout: 10000,
    });

    const matches = (data.matches || []).map((m) => ({
      id: m.id,
      date: m.utcDate || '',
      status: m.status || '',
      home_team: {
        id: m.homeTeam.id,
        name: m.homeTeam.name || '',
        crest: m.homeTeam.crest || '',
      },
      away_team: {
        id: m.awayTeam.id,
        name: m.awayTeam.name || '',
        crest: m.awayTeam.crest || '',
      },
      score: {
        home: m.score?.fullTime?.home ?? null,
        away: m.score?.fullTime?.away ?? null,
      },
      competition: m.competition?.name || '',
    }));

    const cacheHours = status === 'SCHEDULED' ? 1 : 6;
    await setCache(cacheKey, matches, cacheHours);
    return matches;
  } catch (err) {
    console.error('API error fetching matches:', err.message);
    return [];
  }
}

async function fetchHeadToHead(matchId) {
  const cacheKey = `h2h_${matchId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const token = process.env.FOOTBALL_API_KEY;
  if (!token) return { aggregates: {}, matches: [] };

  try {
    const { data } = await axios.get(`${BASE_URL}/matches/${matchId}/head2head`, {
      headers: getHeaders(),
      params: { limit: 20 },
      timeout: 10000,
    });

    const result = {
      aggregates: data.aggregates || {},
      matches: (data.matches || [])
        .filter((m) => m.status === 'FINISHED')
        .map((m) => ({
          date: (m.utcDate || '').slice(0, 10),
          competition: m.competition?.name || '',
          home_team: m.homeTeam?.name || '',
          away_team: m.awayTeam?.name || '',
          home_score: m.score?.fullTime?.home ?? null,
          away_score: m.score?.fullTime?.away ?? null,
        })),
    };

    await setCache(cacheKey, result, 24);
    return result;
  } catch (err) {
    console.error('API error fetching H2H:', err.message);
    return { aggregates: {}, matches: [] };
  }
}

async function fetchLeagueStandings(leagueCode) {
  const cacheKey = `standings_${leagueCode}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const token = process.env.FOOTBALL_API_KEY;
  if (!token) return [];

  try {
    const { data } = await axios.get(`${BASE_URL}/competitions/${leagueCode}/standings`, {
      headers: getHeaders(),
      timeout: 10000,
    });

    const standings = data.standings?.find(s => s.type === 'TOTAL')?.table || [];
    const result = standings.map((row) => ({
      position: row.position,
      team_id: row.team.id,
      name: row.team.name,
      crest_url: row.team.crest || '',
      played: row.playedGames,
      wins: row.won,
      draws: row.draw,
      losses: row.lost,
      goals_for: row.goalsFor,
      goals_against: row.goalsAgainst,
      goal_diff: row.goalDifference,
      points: row.points,
    }));

    await setCache(cacheKey, result, 6);
    return result;
  } catch (err) {
    console.error('API error fetching standings:', err.message);
    return [];
  }
}

module.exports = { fetchLeagues, fetchTeamsForLeague, fetchTeamMatches, fetchHeadToHead, fetchLeagueStandings, SUPPORTED_LEAGUES };
