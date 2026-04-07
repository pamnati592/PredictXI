import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, TrendingUp, History, BarChart3, Loader2 } from "lucide-react";
import { getMatchPrediction, type Prediction } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export default function MatchAnalysis() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    getMatchPrediction(Number(matchId))
      .then(setPrediction)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [matchId]);

  const resultColor = (r: "W" | "D" | "L") =>
    r === "W" ? "bg-green-500" : r === "D" ? "bg-yellow-500" : "bg-red-500";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-gray-500">Generating AI prediction...</p>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">{error || "Match not found"}</p>
          <Button onClick={() => navigate("/")} className="mt-4">Back to Home</Button>
        </div>
      </div>
    );
  }

  const { home_team, away_team, home_stats, away_stats, h2h_matches, h2h_summary } = prediction;

  const statRow = (label: string, homeVal: number, awayVal: number, suffix = "") => {
    const total = homeVal + awayVal;
    return (
      <div key={label}>
        <div className="flex justify-between mb-2 text-sm">
          <span className="font-semibold">{homeVal}{suffix}</span>
          <span className="text-gray-600">{label}</span>
          <span className="font-semibold">{awayVal}{suffix}</span>
        </div>
        <div className="flex gap-1 h-3">
          <div className="bg-blue-500 rounded" style={{ width: total ? `${(homeVal / total) * 100}%` : "50%" }} />
          <div className="bg-green-500 rounded" style={{ width: total ? `${(awayVal / total) * 100}%` : "50%" }} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Match Header */}
        <Card className="mb-6 border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <img
                  src={home_team.crest}
                  alt={home_team.name}
                  className="w-14 h-14 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div>
                  <p className="font-bold text-2xl">{home_team.name}</p>
                  <p className="text-sm text-gray-500">Home</p>
                </div>
              </div>
              <div className="px-8 text-3xl font-bold text-gray-400">VS</div>
              <div className="flex items-center gap-4 flex-1 justify-end text-right">
                <div>
                  <p className="font-bold text-2xl">{away_team.name}</p>
                  <p className="text-sm text-gray-500">Away</p>
                </div>
                <img
                  src={away_team.crest}
                  alt={away_team.name}
                  className="w-14 h-14 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Prediction */}
        <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              AI Match Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6 p-6 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Predicted Score</p>
              <p className="text-4xl font-bold text-blue-600">{prediction.predicted_score}</p>
              <Badge variant="outline" className="mt-2 capitalize">Confidence: {prediction.confidence}</Badge>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{home_team.name} Win</span>
                  <span className="font-bold text-blue-600">{prediction.home_win_probability}%</span>
                </div>
                <Progress value={prediction.home_win_probability} className="h-3 [&>div]:bg-blue-600" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Draw</span>
                  <span className="font-bold text-gray-500">{prediction.draw_probability}%</span>
                </div>
                <Progress value={prediction.draw_probability} className="h-3 [&>div]:bg-gray-400" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{away_team.name} Win</span>
                  <span className="font-bold text-red-500">{prediction.away_win_probability}%</span>
                </div>
                <Progress value={prediction.away_win_probability} className="h-3 [&>div]:bg-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
              <h3 className="font-semibold mb-3">Analysis</h3>
              <p className="text-gray-700 leading-relaxed text-right" dir="rtl">{prediction.reasoning}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-3">Key Factors</h3>
              <ul className="space-y-2">
                {prediction.key_factors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 flex-row-reverse text-right" dir="rtl">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-gray-700">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="form" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="form">Recent Form</TabsTrigger>
            <TabsTrigger value="h2h">Head-to-Head</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          {/* Recent Form */}
          <TabsContent value="form">
            <div className="grid md:grid-cols-2 gap-4">
              {[{ team: home_team, stats: home_stats }, { team: away_team, stats: away_stats }].map(({ team, stats }) => (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <img
                        src={team.crest}
                        alt={team.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      {team.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1 mb-4">
                      {stats.form_string.map((r, i) => (
                        <div
                          key={i}
                          className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm ${resultColor(r)}`}
                        >
                          {r}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="bg-green-50 rounded p-2">
                        <p className="font-bold text-green-600">{stats.wins}</p>
                        <p className="text-gray-500">Wins</p>
                      </div>
                      <div className="bg-yellow-50 rounded p-2">
                        <p className="font-bold text-yellow-600">{stats.draws}</p>
                        <p className="text-gray-500">Draws</p>
                      </div>
                      <div className="bg-red-50 rounded p-2">
                        <p className="font-bold text-red-600">{stats.losses}</p>
                        <p className="text-gray-500">Losses</p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 flex justify-between">
                      <span>Avg scored: <strong>{stats.avg_goals_scored.toFixed(1)}</strong></span>
                      <span>Avg conceded: <strong>{stats.avg_goals_conceded.toFixed(1)}</strong></span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Head-to-Head */}
          <TabsContent value="h2h">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Previous Encounters
                </CardTitle>
                {h2h_summary.total_matches > 0 && (
                  <div className="flex gap-3 text-sm mt-2">
                    <Badge className="bg-blue-500">{h2h_summary.home_team_wins} {home_team.name} wins</Badge>
                    <Badge className="bg-gray-400">{h2h_summary.draws} draws</Badge>
                    <Badge className="bg-green-500">{h2h_summary.away_team_wins} {away_team.name} wins</Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {h2h_matches.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No previous encounters found</p>
                ) : (
                  <div className="space-y-3">
                    {h2h_matches.map((m, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{m.home_team}</p>
                          <p className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString()}</p>
                        </div>
                        <div className="px-4 text-center">
                          <p className="font-bold text-lg">
                            {m.home_score ?? "?"} – {m.away_score ?? "?"}
                          </p>
                          <Badge variant="outline" className="text-xs">{m.competition}</Badge>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="font-semibold text-sm">{m.away_team}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats */}
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Season Statistics (last 10 matches)
                </CardTitle>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500" />{home_team.name}</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" />{away_team.name}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {statRow("Goals Scored", home_stats.goals_for, away_stats.goals_for)}
                  {statRow("Goals Conceded", home_stats.goals_against, away_stats.goals_against)}
                  {statRow("Wins", home_stats.wins, away_stats.wins)}
                  {statRow("Points", home_stats.points, away_stats.points)}
                  {statRow("Win Rate", Math.round(home_stats.win_rate * 100), Math.round(away_stats.win_rate * 100), "%")}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{home_team.name}</p>
                      <div className="flex gap-2 text-sm">
                        <Badge className="bg-green-500">{home_stats.wins}W</Badge>
                        <Badge className="bg-yellow-500 text-black">{home_stats.draws}D</Badge>
                        <Badge className="bg-red-500">{home_stats.losses}L</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{away_team.name}</p>
                      <div className="flex gap-2 text-sm">
                        <Badge className="bg-green-500">{away_stats.wins}W</Badge>
                        <Badge className="bg-yellow-500 text-black">{away_stats.draws}D</Badge>
                        <Badge className="bg-red-500">{away_stats.losses}L</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> This prediction is generated using AI analysis of recent form, head-to-head history, and key statistics.
              While grounded in real data patterns, predictions are never guaranteed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
