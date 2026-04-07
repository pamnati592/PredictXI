#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Building Docker images ==="
docker build -t football-analytics-backend:latest "$PROJECT_DIR/backend"
docker build -t football-analytics-frontend:latest "$PROJECT_DIR/frontend"

echo ""
echo "=== Switching kubectl context to docker-desktop ==="
kubectl config use-context docker-desktop

echo ""
echo "=== Installing/Upgrading Helm chart ==="
# Replace the values below with your actual API keys
helm upgrade --install football-analytics "$PROJECT_DIR/helm-chart" \
  --set secret.postgresPassword=football_pass \
  --set secret.jwtSecret=super_secret_jwt_key_change_me \
  --set secret.footballApiKey="${FOOTBALL_API_KEY:-}" \
  --set secret.groqApiKey="${GROQ_API_KEY:-}" \
  --set secret.googleClientId="${GOOGLE_CLIENT_ID:-}" \
  --set secret.googleClientSecret="${GOOGLE_CLIENT_SECRET:-}" \
  --wait --timeout=120s

echo ""
echo "=== Deployment complete! ==="
echo "Frontend: http://localhost (LoadBalancer)"
echo "Backend:  http://localhost:30080"
kubectl get pods
kubectl get svc
