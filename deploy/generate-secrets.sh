#!/usr/bin/env bash
# Génère des secrets aléatoires pour .env (à coller manuellement)
set -euo pipefail

echo "# Secrets générés le $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 48 | tr -d '\n')"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '\n')"
echo "FSPAY_WEBHOOK_SECRET=$(openssl rand -base64 32 | tr -d '\n')"
echo "SEED_SUPERADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | head -c 20)Aa1!"
