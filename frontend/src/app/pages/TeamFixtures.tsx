import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { getTeamForm, getUpcomingMatches, type TeamFormResponse, type Match } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export default function TeamFixtures() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TeamFormResponse | null>(null);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;
    const id = Number(teamId);
    setLoading(true);
    Promise.all([getTeamForm(id), getUpcomingMatches(id)])
      .then(([form, upcoming]) => {
        setFormData(form);
        setFixtures(upcoming.matches);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [teamId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const resultColor = (r: "W" | "D" | "L") =>
    r === "W" ? "bg-green-500" : r === "D" ? "bg-yellow-500" : "bg-red-500";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">{error || "Team not found"}</p>
          <Button onClick={() => navigate("/")} className="mt-4">Back to Home</Button>
        </div>
      </div>
    );
  }

  const { team_name, stats } = formData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Teams
        </Button>

        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold">{team_name}</h1>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-green-500">{stats.wins}W</Badge>
              <Badge className="bg-yellow-500 text-black">{stats.draws}D</Badge>
              <Badge className="bg-red-500">{stats.losses}L</Badge>
              <Badge variant="outline">{stats.goals_for} GF / {stats.goals_against} GA</Badge>
            </div>
          </div>
        </div>

        {/* Recent Form */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Recent Form</h2>
          <div className="flex gap-2">
            {stats.form_string.map((r, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm ${resultColor(r)}`}
              >
                {r}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Fixtures */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Fixtures</h2>
          {fixtures.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No upcoming fixtures available
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {fixtures.map((fixture) => (
                <Card
                  key={fixture.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01] border-2 hover:border-blue-400"
                  onClick={() => navigate(`/match/${fixture.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(fixture.date)}</span>
                      <span className="mx-2">•</span>
                      <span>{formatTime(fixture.date)}</span>
                    </div>
                    <Badge variant="outline" className="w-fit">{fixture.competition}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={fixture.home_team.crest}
                          alt={fixture.home_team.name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div>
                          <p className="font-semibold text-lg">{fixture.home_team.name}</p>
                          <p className="text-sm text-gray-500">Home</p>
                        </div>
                      </div>

                      <div className="px-6 text-2xl font-bold text-gray-400">VS</div>

                      <div className="flex items-center gap-3 flex-1 justify-end text-right">
                        <div>
                          <p className="font-semibold text-lg">{fixture.away_team.name}</p>
                          <p className="text-sm text-gray-500">Away</p>
                        </div>
                        <img
                          src={fixture.away_team.crest}
                          alt={fixture.away_team.name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <Button className="w-full" variant="outline">
                        View AI Prediction & Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
