#!/usr/bin/env bash
# Déploiement / mise à jour sur VPS Hostinger
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Fichier .env manquant. Exécutez : cp .env.example .env && nano .env"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

if [[ -z "${DOMAIN:-}" || -z "${JWT_ACCESS_SECRET:-}" ]]; then
  echo "DOMAIN et JWT_ACCESS_SECRET sont obligatoires dans .env"
  exit 1
fi

if [[ "${JWT_ACCESS_SECRET}" == *"CHANGE_ME"* ]]; then
  echo "Remplacez JWT_ACCESS_SECRET (et les autres CHANGE_ME) dans .env avant de déployer."
  exit 1
fi

echo "→ Build & démarrage (domaine: ${DOMAIN})"
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo "→ État des services"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "Santé API (via conteneur) :"
docker compose -f docker-compose.prod.yml exec -T server \
  node -e "fetch('http://127.0.0.1:5001/api/health').then(r=>r.json()).then(d=>console.log(JSON.stringify(d))).catch(e=>{console.error(e);process.exit(1)})" \
  || echo "(API pas encore prête — réessayez dans quelques secondes)"

echo ""
echo "Site : https://${DOMAIN}"
echo "Admin : https://${DOMAIN}/admin/connexion"
echo "Formateur : https://${DOMAIN}/formateur/connexion"
echo ""
echo "Premier déploiement ? Seed superadmin :"
echo "  docker compose -f docker-compose.prod.yml exec server node src/jobs/seed.js"
