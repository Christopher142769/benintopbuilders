# Go-live Hostinger — checklist opérateur

Ce fichier complète [`DEPLOY_HOSTINGER.md`](./DEPLOY_HOSTINGER.md).  
Le déploiement réel se fait **sur votre VPS** (accès SSH requis).

## Avant

- [ ] VPS Hostinger créé (Ubuntu 22.04+)
- [ ] IP VPS notée : `________________`
- [ ] Domaine : `________________`
- [ ] DNS A `@` → IP VPS (et optionnellement `www`)
- [ ] Ports 80 / 443 ouverts

## Sur le VPS

```bash
ssh root@VOTRE_IP
curl -fsSL https://get.docker.com | sh
cd /opt && git clone https://github.com/Christopher142769/benintopbuilders.git
cd benintopbuilders
cp .env.example .env
bash deploy/generate-secrets.sh
nano .env   # DOMAIN + secrets + SMTP
bash deploy/deploy.sh
docker compose -f docker-compose.prod.yml exec server node src/jobs/seed.js
```

## Validation

- [ ] `curl -fsS https://VOTRE_DOMAINE/api/health` → JSON `success`
- [ ] Landing accessible en HTTPS
- [ ] `/admin/connexion` fonctionne
- [ ] `/formateur/connexion` fonctionne
- [ ] Connexion superadmin OK
- [ ] Upload logo / messagerie (Socket) OK

## Après go-live

- [ ] Changer le mot de passe superadmin
- [ ] Configurer SMTP
- [ ] Planifier `mongodump` quotidien
- [ ] Activer FSPay quand prêt
