// Mock data for the football analytics app

export interface Team {
  id: string;
  name: string;
  logo: string;
  league: string;
  country: string;
}

export interface Fixture {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  venue: string;
  league: string;
}

export interface RecentMatch {
  date: string;
  opponent: string;
  result: "W" | "D" | "L";
  score: string;
  homeAway: "H" | "A";
}

export interface HeadToHeadMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  competition: string;
}

export interface TeamStats {
  goalsScored: number;
  goalsConceded: number;
  wins: number;
  draws: number;
  losses: number;
  cleanSheets: number;
  possession: number;
  shotsPerGame: number;
  passAccuracy: number;
}

export interface Prediction {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedScore: string;
  analysis: string;
  keyFactors: string[];
}

// Mock teams database
export const teams: Team[] = [
  {
    id: "1",
    name: "Manchester United",
    logo: "🔴",
    league: "Premier League",
    country: "England",
  },
  {
    id: "2",
    name: "Liverpool",
    logo: "🔴",
    league: "Premier League",
    country: "England",
  },
  {
    id: "3",
    name: "Manchester City",
    logo: "💙",
    league: "Premier League",
    country: "England",
  },
  {
    id: "4",
    name: "Arsenal",
    logo: "🔴",
    league: "Premier League",
    country: "England",
  },
  {
    id: "5",
    name: "Chelsea",
    logo: "💙",
    league: "Premier League",
    country: "England",
  },
  {
    id: "6",
    name: "Real Madrid",
    logo: "⚪",
    league: "La Liga",
    country: "Spain",
  },
  {
    id: "7",
    name: "Barcelona",
    logo: "🔵",
    league: "La Liga",
    country: "Spain",
  },
  {
    id: "8",
    name: "Bayern Munich",
    logo: "🔴",
    league: "Bundesliga",
    country: "Germany",
  },
  {
    id: "9",
    name: "Paris Saint-Germain",
    logo: "🔵",
    league: "Ligue 1",
    country: "France",
  },
  {
    id: "10",
    name: "Juventus",
    logo: "⚫",
    league: "Serie A",
    country: "Italy",
  },
];

// Mock fixtures generator
export const getTeamFixtures = (teamId: string): Fixture[] => {
  const team = teams.find((t) => t.id === teamId);
  if (!team) return [];

  const opponents = teams.filter((t) => t.id !== teamId && t.league === team.league).slice(0, 5);
  
  return opponents.map((opponent, index) => ({
    id: `${teamId}-${opponent.id}-${index}`,
    homeTeam: index % 2 === 0 ? team : opponent,
    awayTeam: index % 2 === 0 ? opponent : team,
    date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    venue: index % 2 === 0 ? `${team.name} Stadium` : `${opponent.name} Stadium`,
    league: team.league,
  }));
};

// Mock recent form
export const getRecentForm = (teamId: string): RecentMatch[] => {
  const results: ("W" | "D" | "L")[] = ["W", "W", "D", "L", "W"];
  const opponents = ["Everton", "Brighton", "Tottenham", "Newcastle", "West Ham"];
  
  return results.map((result, index) => ({
    date: new Date(Date.now() - (5 - index) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    opponent: opponents[index],
    result,
    score: result === "W" ? "2-1" : result === "D" ? "1-1" : "0-2",
    homeAway: index % 2 === 0 ? "H" : "A",
  }));
};

// Mock head-to-head
export const getHeadToHead = (team1Id: string, team2Id: string): HeadToHeadMatch[] => {
  const team1 = teams.find((t) => t.id === team1Id);
  const team2 = teams.find((t) => t.id === team2Id);
  
  if (!team1 || !team2) return [];

  return [
    {
      date: "2025-09-15",
      homeTeam: team1.name,
      awayTeam: team2.name,
      score: "2-1",
      competition: team1.league,
    },
    {
      date: "2025-03-20",
      homeTeam: team2.name,
      awayTeam: team1.name,
      score: "1-1",
      competition: team1.league,
    },
    {
      date: "2024-11-10",
      homeTeam: team1.name,
      awayTeam: team2.name,
      score: "3-2",
      competition: team1.league,
    },
    {
      date: "2024-05-05",
      homeTeam: team2.name,
      awayTeam: team1.name,
      score: "0-2",
      competition: team1.league,
    },
  ];
};

// Mock team stats
export const getTeamStats = (teamId: string): TeamStats => {
  // Generate semi-realistic stats based on team ID
  const seed = parseInt(teamId);
  
  return {
    goalsScored: 25 + seed * 2,
    goalsConceded: 15 + seed,
    wins: 12 + seed,
    draws: 5,
    losses: 3 + seed,
    cleanSheets: 8 + seed,
    possession: 55 + seed,
    shotsPerGame: 12 + seed,
    passAccuracy: 82 + seed,
  };
};

// Mock AI prediction (simulates Groq/LLaMA response)
export const generatePrediction = (fixture: Fixture): Prediction => {
  const homeTeamId = parseInt(fixture.homeTeam.id);
  const awayTeamId = parseInt(fixture.awayTeam.id);
  
  // Simple calculation for probabilities (in real app, this comes from AI)
  const homeBias = 10; // Home advantage
  const diff = homeTeamId - awayTeamId;
  
  let homeWin = 45 + homeBias - diff * 5;
  let awayWin = 30 + diff * 5;
  let draw = 100 - homeWin - awayWin;
  
  // Normalize
  const total = homeWin + draw + awayWin;
  homeWin = Math.round((homeWin / total) * 100);
  awayWin = Math.round((awayWin / total) * 100);
  draw = 100 - homeWin - awayWin;

  const predictedScore = homeWin > awayWin ? "2-1" : awayWin > homeWin ? "1-2" : "1-1";

  return {
    homeWinProbability: homeWin,
    drawProbability: draw,
    awayWinProbability: awayWin,
    predictedScore,
    analysis: `Based on comprehensive analysis of recent form, head-to-head records, and key performance indicators, this match presents an intriguing tactical battle. ${fixture.homeTeam.name} comes into this fixture with solid home form, having won their last two matches at their stadium. Their attacking output has been particularly impressive, averaging over 2 goals per game in recent weeks.\n\nOn the other hand, ${fixture.awayTeam.name} has shown resilience on the road, though they've struggled to convert chances into goals consistently. Their defensive organization will be key, as they face a ${fixture.homeTeam.name} side that excels in high-pressure situations.\n\nThe head-to-head history shows relatively balanced encounters, with both teams capable of winning. However, the home advantage and current momentum slightly favor ${fixture.homeTeam.name}. Expected scoreline: ${predictedScore}, with ${fixture.homeTeam.name} edging this in what should be an entertaining contest.`,
    keyFactors: [
      `${fixture.homeTeam.name}'s strong home record (12-3-2 this season)`,
      `${fixture.awayTeam.name}'s improved defensive stability in recent weeks`,
      "Head-to-head history suggests tight matches with narrow margins",
      "Home advantage typically worth 0.5-0.7 goals in this fixture",
      "Both teams' key players are fit and available",
    ],
  };
};
