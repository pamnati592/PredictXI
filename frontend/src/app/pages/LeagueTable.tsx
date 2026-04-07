import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Trophy, Loader2 } from "lucide-react";
import { getLeagueTable, type LeagueTableRow } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export default function LeagueTable() {
  const { leagueId: leagueCode } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [table, setTable] = useState<LeagueTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueCode) return;
    getLeagueTable(leagueCode)
      .then(setTable)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [leagueCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-gray-500">Loading league table...</p>
      </div>
    );
  }

  if (!loading && (error || table.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-4">No data available for this league</p>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 block mx-auto">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                League Table
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600">
                    <th className="text-left px-4 py-3 w-8">#</th>
                    <th className="text-left px-4 py-3">Team</th>
                    <th className="text-center px-3 py-3">P</th>
                    <th className="text-center px-3 py-3">W</th>
                    <th className="text-center px-3 py-3">D</th>
                    <th className="text-center px-3 py-3">L</th>
                    <th className="text-center px-3 py-3">GF</th>
                    <th className="text-center px-3 py-3">GA</th>
                    <th className="text-center px-3 py-3">GD</th>
                    <th className="text-center px-3 py-3 font-bold text-gray-800">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((row, i) => (
                    <tr
                      key={row.team_id}
                      className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/team/${row.team_id}`)}
                    >
                      <td className="px-4 py-3 text-gray-500 font-medium">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={row.crest_url}
                            alt={row.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <span className="font-medium">{row.name}</span>
                        </div>
                      </td>
                      <td className="text-center px-3 py-3 text-gray-600">{row.played}</td>
                      <td className="text-center px-3 py-3 text-green-600 font-medium">{row.wins}</td>
                      <td className="text-center px-3 py-3 text-yellow-600">{row.draws}</td>
                      <td className="text-center px-3 py-3 text-red-500">{row.losses}</td>
                      <td className="text-center px-3 py-3">{row.goals_for}</td>
                      <td className="text-center px-3 py-3">{row.goals_against}</td>
                      <td className="text-center px-3 py-3">
                        <Badge variant={row.goal_diff > 0 ? "default" : row.goal_diff < 0 ? "destructive" : "outline"} className="text-xs">
                          {row.goal_diff > 0 ? "+" : ""}{row.goal_diff}
                        </Badge>
                      </td>
                      <td className="text-center px-3 py-3 font-bold text-blue-700">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
