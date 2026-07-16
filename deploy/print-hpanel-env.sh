#!/usr/bin/env bash
# Affiche les variables à copier dans hPanel / Hostinger Connector (sans secrets en dur).
# Les vraies valeurs sont dans server/.env (local, gitignored).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/server/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "server/.env introuvable. Créez-le d'abord."
  exit 1
fi

echo "# Copier ces paires clé=valeur dans hPanel → Environment Variables"
echo "# ou demander à Hostinger Connector de les configurer avant le deploy."
echo ""

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  key="${line%%=*}"
  case "$key" in
    VITE_*)
      echo "$line"
      ;;
    NODE_ENV|PORT|CLIENT_URL|CORS_ORIGINS|MONGODB_URI|JWT_*|SMTP_*|MAIL_FROM|FSPAY_*|UPLOAD_*|MAX_UPLOAD_*|SEED_*)
      echo "$line"
      ;;
  esac
done < "$ENV_FILE"

echo ""
echo "VITE_API_URL=/api"
echo "VITE_SOCKET_URL="
echo "VITE_APP_NAME=Bénin Top Builders"
