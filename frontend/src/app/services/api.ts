import axios from "axios";

// ── Axios instance ──────────────────────────────────────────────────────────
const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Types ────────────────────────────────────────────────────────────────────

export interface League {
  id: number;
  name: string;
  country: string;
  code: string;
  emblem_url: string;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  crest_url: string;
  country: string;
}

export interface MatchTeam {
  id: number;
  name: string;
  crest: string;
}

export interface Match {
  id: number;
  date: string;
  status: string;
  home_team: MatchTeam;
  away_team: MatchTeam;
  score: { home: number | null; away: number | null };
  competition: string;
}

export interface FormStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  win_rate: number;
  form_string: ("W" | "D" | "L")[];
  avg_goals_scored: number;
  avg_goals_conceded: number;
}

export interface TeamFormResponse {
  team_id: number;
  team_name: string;
  stats: FormStats;
  matches: Match[];
}

export interface H2HMatch {
  date: string;
  competition: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
}

export interface H2HSummary {
  total_matches: number;
  home_team_wins: number;
  draws: number;
  away_team_wins: number;
  home_team_goals: number;
  away_team_goals: number;
}

export interface Prediction {
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  predicted_score: string;
  confidence: "low" | "medium" | "high";
  key_factors: string[];
  reasoning: string;
  home_team: MatchTeam;
  away_team: MatchTeam;
  home_stats: FormStats;
  away_stats: FormStats;
  h2h_summary: H2HSummary;
  h2h_matches: H2HMatch[];
}

export interface LeagueTableRow {
  position: number;
  team_id: number;
  name: string;
  crest_url: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
}

export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url?: string;
}

// ── Football API Calls ────────────────────────────────────────────────────────

export async function getLeagues(): Promise<League[]> {
  const { data } = await api.get("/leagues");
  return data;
}

export async function getTeams(leagueCode: string): Promise<Team[]> {
  const { data } = await api.get("/teams", { params: { league_code: leagueCode } });
  return data;
}

export async function getTeamForm(teamId: number): Promise<TeamFormResponse> {
  const { data } = await api.get(`/teams/${teamId}/form`);
  return data;
}

export async function getUpcomingMatches(teamId: number): Promise<{ matches: Match[] }> {
  const { data } = await api.get(`/teams/${teamId}/upcoming`);
  return data;
}

export async function getMatchPrediction(matchId: number): Promise<Prediction> {
  const { data } = await api.get(`/matches/${matchId}/prediction`);
  return data;
}

export async function getLeagueTable(leagueCode: string): Promise<LeagueTableRow[]> {
  const { data } = await api.get(`/leagues/${leagueCode}/table`);
  return data;
}

export async function syncLeague(leagueCode: string): Promise<{ synced: number; season: number; total_matches: number; error?: string }> {
  const { data } = await api.post(`/leagues/${leagueCode}/sync`);
  return data;
}

// ── Auth Calls ────────────────────────────────────────────────────────────────

export async function authLogin(email: string, password: string): Promise<{ token: string; user: User }> {
  const { data } = await axios.post("/api/auth/login", { email, password });
  return data;
}

export async function authRegister(username: string, email: string, password: string): Promise<{ token: string; user: User }> {
  const { data } = await axios.post("/api/auth/register", { username, email, password });
  return data;
}

export default api;
