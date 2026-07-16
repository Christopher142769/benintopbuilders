# Déploiement Hostinger — VPS + Docker

Guide pour mettre **Bénin Top Builders** en ligne sur un **VPS Hostinger** (Ubuntu 22.04+).  
L’hébergement mutualisé / Business Web ne convient pas (Node, MongoDB, Socket.io).

## Architecture

```
Internet → Caddy (:80/:443, HTTPS Let's Encrypt)
              ↓
         Nginx client (:80 dans Docker)  →  fichiers React
              ↓ /api /uploads /socket.io
         Express API (:5001)  →  MongoDB (réseau Docker privé)
```

Fichiers clés :

| Fichier | Rôle |
|---------|------|
| [`.env.example`](../.env.example) | Template secrets + domaine |
| [`docker-compose.prod.yml`](../docker-compose.prod.yml) | Stack production |
| [`deploy/Caddyfile`](./Caddyfile) | HTTPS automatique |
| [`deploy/deploy.sh`](./deploy.sh) | Script de mise en ligne |
| [`deploy/generate-secrets.sh`](./generate-secrets.sh) | Génération JWT / mots de passe |

## Prérequis Hostinger

1. **VPS** (KVM 1 minimum recommandé : 1 vCPU, 4 Go RAM).
2. **Domaine** pointant vers l’IP du VPS :
   - enregistrement **A** `@` → IP du VPS ;
   - enregistrement **A** `www` → IP du VPS (optionnel, redirigé vers l’apex).
3. Ports **80** et **443** ouverts dans le firewall Hostinger / ufw.
4. Accès **SSH** root ou sudo.

## 1. Préparer le VPS

```bash
ssh root@VOTRE_IP_VPS

apt update && apt upgrade -y
apt install -y ca-certificates curl git openssl

# Docker (officiel)
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# Pare-feu
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 2. Cloner le projet

```bash
mkdir -p /opt && cd /opt
git clone git@github.com:Christopher142769/benintopbuilders.git
# ou : git clone https://github.com/Christopher142769/benintopbuilders.git
cd benintopbuilders
```

## 3. Configurer l’environnement

```bash
cp .env.example .env
bash deploy/generate-secrets.sh   # affiche des secrets à coller dans .env
nano .env
```

À renseigner obligatoirement dans `.env` :

- `DOMAIN` — ex. `benintopbuilders.bj` (sans `https://`)
- `PUBLIC_URL` / `CLIENT_URL` / `CORS_ORIGINS` / `FSPAY_CALLBACK_URL` — avec `https://`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `FSPAY_WEBHOOK_SECRET`
- `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD`
- SMTP Hostinger si disponible (`SMTP_USER` / `SMTP_PASS`)

## 4. Déployer

```bash
chmod +x deploy/deploy.sh deploy/generate-secrets.sh
bash deploy/deploy.sh
```

Ou manuellement :

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Attendre ~1–2 minutes (certificat Let's Encrypt + build).

## 5. Seed du superadmin (une fois)

```bash
docker compose -f docker-compose.prod.yml exec server node src/jobs/seed.js
```

⚠️ Le seed **vide** les collections métier puis recrée le superadmin. Ne l’exécuter qu’au premier déploiement (ou en connaissance de cause).

## 6. Vérifications

```bash
# Conteneurs
docker compose -f docker-compose.prod.yml ps

# Health API
docker compose -f docker-compose.prod.yml exec server \
  node -e "fetch('http://127.0.0.1:5001/api/health').then(r=>r.json()).then(console.log)"

# Depuis l’extérieur
curl -fsS https://VOTRE_DOMAINE/api/health
```

URLs :

- Site : `https://VOTRE_DOMAINE/`
- Admin : `https://VOTRE_DOMAINE/admin/connexion`
- Formateur : `https://VOTRE_DOMAINE/formateur/connexion`

## 7. Mises à jour ultérieures

```bash
cd /opt/benintopbuilders
git pull
bash deploy/deploy.sh
```

Les volumes `mongo_data` et `uploads_data` sont conservés.

## 8. Sauvegardes MongoDB

```bash
# Dump
docker compose -f docker-compose.prod.yml exec -T mongo \
  mongodump --archive --db=benin-top-builders > backup-$(date +%F).archive

# Restore (exemple)
cat backup-YYYY-MM-DD.archive | docker compose -f docker-compose.prod.yml exec -T mongo \
  mongorestore --archive --drop --db=benin-top-builders
```

Planifier un cron quotidien sur le VPS (ex. `/etc/cron.daily/btb-mongo`).

## 9. Checklist production

- [ ] DNS A propagé vers le VPS
- [ ] HTTPS valide (cadenas navigateur)
- [ ] Secrets JWT / FSPay changés (plus de `CHANGE_ME`)
- [ ] SMTP réel configuré (OTP / mails)
- [ ] `CORS_ORIGINS` limité au domaine public
- [ ] Superadmin seedé et mot de passe changé
- [ ] Sauvegarde Mongo planifiée
- [ ] FSPay : `FSPAY_BASE_URL` + clés + webhook HTTPS quand prêt

## Dépannage

| Symptôme | Piste |
|----------|--------|
| Certificat Let's Encrypt échoue | DNS pas encore pointé, ports 80/443 fermés, `DOMAIN` incorrect |
| 502 Bad Gateway | `docker compose … logs server` / `logs client` |
| CORS / cookies | `CLIENT_URL` et `CORS_ORIGINS` en `https://…` |
| Socket messagerie KO | Vérifier `/socket.io/` via Caddy → Nginx → API |
| Mongo inaccessible | Ne pas exposer 27017 ; URI `mongodb://mongo:27017/...` |

Logs :

```bash
docker compose -f docker-compose.prod.yml logs -f --tail=100 caddy
docker compose -f docker-compose.prod.yml logs -f --tail=100 server
```
