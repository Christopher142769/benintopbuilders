#!/usr/bin/env bash
# Déploiement / mise à jour sur VPS Hostinger — SANS Docker
# Prérequis sur le VPS : Node 20, PM2, Nginx, MongoDB (voir DEPLOY_HOSTINGER.md)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f server/.env ]]; then
  echo "server/.env manquant."
  echo "  cp server/.env.production.example server/.env && nano server/.env"
  exit 1
fi

if [[ ! -f client/.env.production ]]; then
  echo "client/.env.production manquant."
  echo "  cp client/.env.production.example client/.env.production && nano client/.env.production"
  exit 1
fi

if grep -q "CHANGE_ME" server/.env; then
  echo "Remplacez les valeurs CHANGE_ME dans server/.env avant de déployer."
  exit 1
fi

if ! command -v pm2 >/dev/null; then
  echo "PM2 n'est pas installé. Exécutez : sudo npm install -g pm2"
  exit 1
fi

mkdir -p logs

echo "→ Installation des dépendances serveur"
npm ci --omit=dev --prefix server

echo "→ Installation des dépendances client"
npm ci --prefix client

echo "→ Build du client (utilise client/.env.production)"
npm run build --prefix client

echo "→ (Re)démarrage de l'API via PM2"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

echo "→ Test puis rechargement de Nginx"
if command -v nginx >/dev/null; then
  sudo nginx -t
  sudo systemctl reload nginx
else
  echo "Nginx introuvable en PATH — rechargez-le manuellement si besoin (sudo systemctl reload nginx)."
fi

echo ""
echo "Déploiement terminé."
echo "Vérification locale : curl -fsS http://127.0.0.1:5001/api/health"
echo "Logs API            : pm2 logs btb-api"
echo ""
echo "Premier déploiement ? Seed du superadmin :"
echo "  cd server && node src/jobs/seed.js && cd .."
