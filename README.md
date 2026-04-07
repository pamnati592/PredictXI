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

## Quick Start

### Prerequisites
- Docker Desktop with Kubernetes enabled
- Helm 3

### 1. Clone and configure

```bash
git clone https://github.com/pamnati592/PredictXI.git
cd PredictXI
cp helm-chart/values.example.yaml helm-chart/values.yaml
```

Edit `helm-chart/values.yaml` with your secrets:

```yaml
secret:
  postgresPassword: "your_strong_password"
  jwtSecret: "your_jwt_secret"        # generate: openssl rand -base64 32
  footballApiKey: "your_key"           # from football-data.org
  groqApiKey: "your_key"              # from console.groq.com
  googleClientId: "your_client_id"    # optional — Google OAuth
  googleClientSecret: "your_secret"   # optional — Google OAuth
```

### 2. Build Docker images

```bash
docker build -t predictxi-backend:latest ./backend
docker build -t predictxi-frontend:latest ./frontend
```

### 3. Deploy with Helm

**Option A — from local chart (after clone):**
```bash
helm install predictxi ./helm-chart -f helm-chart/values.yaml
```

**Option B — Helm chart from GHCR (no clone needed):**
```bash
# 1. Download the values template
curl -O https://raw.githubusercontent.com/pamnati592/PredictXI/main/helm-chart/values.example.yaml
mv values.example.yaml values.yaml

# 2. Fill in your secrets in values.yaml

# 3. Build Docker images (still required)
docker build -t predictxi-backend:latest https://github.com/pamnati592/PredictXI.git#main:backend
docker build -t predictxi-frontend:latest https://github.com/pamnati592/PredictXI.git#main:frontend

# 4. Install from GHCR
helm install predictxi oci://ghcr.io/pamnati592/predictxi --version 0.1.0 -f values.yaml
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
│   │   ├── pages/     # Home, Login, Register, LeagueTable, MatchAnalysis
│   │   ├── services/  # Axios API client
│   │   └── context/   # AuthContext (JWT)
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
