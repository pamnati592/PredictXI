import { createBrowserRouter, Navigate } from "react-router";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import TeamFixtures from "./pages/TeamFixtures";
import MatchAnalysis from "./pages/MatchAnalysis";
import LeagueTable from "./pages/LeagueTable";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OAuthCallback from "./pages/OAuthCallback";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/login",          Component: Login },
  { path: "/register",       Component: Register },
  { path: "/oauth-callback", Component: OAuthCallback },
  { path: "/",               element: <ProtectedRoute><Home /></ProtectedRoute> },
  { path: "/team/:teamId",   element: <ProtectedRoute><TeamFixtures /></ProtectedRoute> },
  { path: "/match/:matchId", element: <ProtectedRoute><MatchAnalysis /></ProtectedRoute> },
  { path: "/league/:leagueId/table", element: <ProtectedRoute><LeagueTable /></ProtectedRoute> },
]);
