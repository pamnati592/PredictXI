import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";
import axios from "axios";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (!token) { navigate("/login"); return; }

    // Fetch user info with the token
    axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { login(token, data); navigate("/"); })
      .catch(() => navigate("/login?error=oauth_failed"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-500">Completing sign in...</p>
      </div>
    </div>
  );
}
