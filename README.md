# Bénin Top Builders

Écosystème numérique du BTP au Bénin — annuaire, appels d'offres, labellisation, marketplace, formations, messagerie.

## Stack

- **Client** : React 18 + Vite, React Router, TanStack Query, Zustand, Tailwind
- **Server** : Node 20 + Express, Mongoose, JWT, FSPay sandbox, Socket.io, node-cron
- **DB** : MongoDB

## Prérequis

- Node.js ≥ 20
- MongoDB local (`mongodb://127.0.0.1:27017`)

## Installation

```bash
npm run install:all
cp server/.env.example server/.env
# Ajuster JWT_*, MONGODB_URI, SMTP si besoin
```

## Développement

```bash
npm run seed          # superadmin + données démo
npm run dev           # client :5173 + API :5001
```

- App : http://localhost:5173  
- Health : http://localhost:5001/api/health  

## Comptes de démo (après seed)

| Rôle | E-mail | Mot de passe |
|------|--------|--------------|
| Superadmin | `superadmin@benintopbuilders.bj` (ou `SEED_SUPERADMIN_*`) | `ChangeMeSuperAdmin1!` (env) |

Le seed ne crée **pas** de contenu fictif : annuaire, appels d’offres, matériaux et formations restent vides jusqu’à publication via le dashboard / admin.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Client + serveur |
| `npm run seed` | Jeu de données |
| `npm test` | Jest + Supertest |
| `npm run build` | Build client |
| `npm run secrets` | Génère des secrets JWT pour `.env` |
| `npm run deploy:prod` | Déploie via Docker Compose prod |

## Docker (local)

```bash
docker compose up --build
```

Client nginx : http://localhost:8080 · API : http://localhost:5001

## Mise en ligne Hostinger (VPS)

Stack recommandée : **VPS Ubuntu + Docker Compose + Caddy (HTTPS)**.

Guide complet : [`deploy/DEPLOY_HOSTINGER.md`](deploy/DEPLOY_HOSTINGER.md)

Résumé :

```bash
# Sur le VPS
git clone https://github.com/Christopher142769/benintopbuilders.git
cd benintopbuilders
cp .env.example .env
bash deploy/generate-secrets.sh   # coller les secrets dans .env
nano .env                         # DOMAIN, SMTP, etc.
bash deploy/deploy.sh
docker compose -f docker-compose.prod.yml exec server node src/jobs/seed.js
```

L’hébergement mutualisé Hostinger n’est **pas** adapté (API Node, MongoDB, WebSocket).

## Mise en production (checklist)

- [ ] VPS Hostinger + DNS A vers l’IP
- [ ] HTTPS (Caddy / Let's Encrypt via `docker-compose.prod.yml`)
- [ ] Secrets JWT / FSPay / webhook HMAC réels (`.env`)
- [ ] SMTP réel (plus de mode console)
- [ ] `FSPAY_BASE_URL` + clés API quand le paiement est actif
- [ ] Sauvegardes MongoDB planifiées
- [ ] Monitoring des crons (clôture AO, stocks, adhésion 06:00)
- [ ] `CORS_ORIGINS` restreint au domaine public
- [ ] Uploads hors git, volume Docker `uploads_data`

## Formules d'adhésion (annuel, FCFA)

| Formule | Tarif | Droits principaux |
|---------|-------|-------------------|
| Découverte | 0 | Profil de base, annuaire, 2 candidatures AO / mois |
| Standard | 200 000 | Profil complet, AO illimités, messagerie, alertes |
| Premium | 500 000 | Badge, mise en avant, AO anticipés, stats, multi-comptes |
| Access | 1 000 000 | Boutique / vitrine e-commerce fournisseurs |
| Business | Sur devis | Offre à la carte (spots, promos, besoins complexes) |

## Parcours de recette manuelle

1. **Adhésion** — Landing → Inscrire (profil + formalités) → OTP → Charte → formule  
2. **Fiche + label** — Dashboard → Ma fiche → Demander labellisation → payer audit → admin `/admin/dossiers`  
3. **AO** — Publier besoin → répondre (quota Découverte) → retenir → messagerie (Standard+)  
4. **Marketplace** — Formule Access/Business → boutique → commande + stock  
5. **Formations** — Inscription + attestation après émargement admin  
6. **Messagerie** — Contacter depuis fiche ; contacts masqués si non actifs  
7. **Adhésion** — Renouvellement auto / historique `/dashboard/adhesion`  
8. **Admin** — Stats, membres, moderation, audit  
