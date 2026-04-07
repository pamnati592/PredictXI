import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, TrendingUp, Loader2, Trophy, LogOut } from "lucide-react";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { getLeagues, getTeams, type League, type Team } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getLeagues()
      .then(setLeagues)
      .finally(() => setLoadingLeagues(false));
  }, []);

  const handleLeagueSelect = async (league: League) => {
    setSelectedLeague(league);
    setTeams([]);
    setSearchQuery("");
    setLoadingTeams(true);
    try {
      const data = await getTeams(league.code);
      setTeams(data);
    } finally {
      setLoadingTeams(false);
    }
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="w-12 h-12 text-blue-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              PredictXI
            </h1>
          </div>
          <p className="text-xl text-gray-600">AI-Powered Match Predictions</p>
          {user && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="text-sm text-gray-500">Welcome, <strong>{user.username || user.email}</strong></span>
              <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-red-500 gap-1">
                <LogOut className="w-4 h-4" /> Sign out
              </Button>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Select your team to get instant insights, upcoming fixtures, and match predictions
          </p>
        </div>

        {loadingLeagues ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !selectedLeague ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Select a League</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {leagues.map((league) => (
                <Card
                  key={league.code}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2 hover:border-blue-400"
                  onClick={() => handleLeagueSelect(league)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <img
                      src={league.emblem_url}
                      alt={league.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div>
                      <div className="font-semibold text-sm">{league.name}</div>
                      <div className="text-xs text-gray-500">{league.country}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedLeague(null); setTeams([]); }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  ← All Leagues
                </button>
                <div className="flex items-center gap-2">
                  <img
                    src={selectedLeague.emblem_url}
                    alt={selectedLeague.name}
                    className="w-7 h-7 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <span className="font-semibold text-gray-700">{selectedLeague.name}</span>
                  <Badge variant="outline">{selectedLeague.country}</Badge>
                </div>
              </div>
              <button
                onClick={() => navigate(`/league/${selectedLeague.code}/table`)}
                className="flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700 font-medium border border-yellow-300 rounded px-3 py-1.5 hover:bg-yellow-50 transition-colors"
              >
                <Trophy className="w-4 h-4" />
                League Table
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for your team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-6 text-lg"
              />
            </div>

            {loadingTeams ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTeams.map((team) => (
                  <Card
                    key={team.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2 hover:border-blue-400"
                    onClick={() => navigate(`/team/${team.id}`)}
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <img
                        src={team.crest_url}
                        alt={team.name}
                        className="w-12 h-12 object-contain flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{team.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{selectedLeague.name}</Badge>
                          <Badge variant="outline" className="text-xs">{team.country}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredTeams.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-gray-500">
                    No teams found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
