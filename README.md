# PredictXI ⚽

AI-powered football match prediction platform deployed on Kubernetes.

## Features

- **AI Match Predictions** — statistical model (Dixon-Coles xG) + Groq LLM analysis
- **League Tables** — live standings for 11 leagues
- **Team Stats** — form, recent matches, upcoming fixtures
- **Head-to-Head History** — historical matchup data
- **Authentication** — JWT email/password + Google OAuth
- **Kubernetes deployment** — full Helm chart, production-ready

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express |
| Database | PostgreSQL (K8s StatefulSet) |
| Prediction | Dixon-Coles xG model + Groq LLM (llama-3.3-70b) |
| Data | football-data.org API |
| Auth | JWT + Google OAuth 2.0 |
| Infrastructure | Kubernetes (Docker Desktop) + Helm |

## Prediction Model

The prediction engine uses a multi-layer statistical approach:

1. **Dixon-Coles xG** — attack × defense / league_avg with time decay `φ(t) = e^(-0.0065t)`
2. **Competition quality weights** — Premier League = 1.0, Israeli league = 0.52, Champions League = 1.10
3. **Home advantage** — +0.35 xG, scaled by quality gap between teams
4. **Momentum** — last 5 matches weighted higher than overall form
5. **H2H blend** — up to 40% weight from head-to-head history
6. **AI adjustment** — Groq LLM reviews all stats and can adjust ±15%

## Quick Start

### Prerequisites
- Docker Desktop with Kubernetes enabled
- Helm 3

### 1. Clone and configure

```bash
git clone https://github.com/pamnati592/k8s-finalProject.git
cd k8s-finalProject
cp helm-chart/values.example.yaml helm-chart/values.yaml
```

Edit `helm-chart/values.yaml` with your secrets:

```yaml
secret:
  postgresPassword: "your_strong_password"
  jwtSecret: "$(openssl rand -base64 32)"
  footballApiKey: "your_key_from_football-data.org"
  groqApiKey: "your_key_from_console.groq.com"
  googleClientId: "your_google_client_id"       # optional
  googleClientSecret: "your_google_client_secret" # optional
```

### 2. Build Docker images

```bash
docker build -t predictxi-backend:latest ./backend
docker build -t predictxi-frontend:latest ./frontend
```

### 3. Deploy with Helm

```bash
helm install predictxi ./helm-chart -f helm-chart/values.yaml
```

### 4. Access

```
http://localhost
```

## API Keys

| Service | URL | Free tier |
|---------|-----|-----------|
| Football Data | https://www.football-data.org | 10 req/min |
| Groq AI | https://console.groq.com | Generous free tier |
| Google OAuth | https://console.cloud.google.com | Free |

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost/api/auth/google/callback`
4. Add Client ID and Secret to `values.yaml`

> Google OAuth is optional — email/password login works without it.

## Project Structure

```
PredictXI/
├── frontend/          # React + TypeScript
│   ├── src/app/
│   │   ├── pages/     # Home, Login, Register, LeagueTable, TeamDetail, MatchAnalysis
│   │   ├── services/  # Axios API client
│   │   └── context/   # AuthContext
│   ├── nginx.conf
│   └── Dockerfile
├── backend/           # Node.js + Express
│   ├── routes/        # auth, teams, matches
│   ├── services/      # footballApi, aiService, statsService
│   ├── db/            # PostgreSQL connection + schema
│   └── Dockerfile
└── helm-chart/        # Kubernetes Helm chart
    ├── templates/     # Deployments, Services, ConfigMap, Secret, PVC
    ├── values.yaml    # Your secrets (gitignored)
    └── values.example.yaml
```

## Supported Leagues

Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Primeira Liga, Championship, Brasileirão, Champions League, Copa Libertadores

## License

MIT
