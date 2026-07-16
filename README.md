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
| `npm start` | Démarre l'API (sert aussi le frontend en production) |
| `npm run secrets` | Génère des secrets JWT/FSPay pour hPanel / `server/.env` |
| `npm run deploy:prod` | Déploiement manuel VPS (PM2 + Nginx, optionnel) |

## Docker (optionnel, aperçu local uniquement)

```bash
docker compose up --build
```

Client nginx : http://localhost:8080 · API : http://localhost:5001

## Mise en ligne Hostinger — Node.js Web App + GitHub

Méthode recommandée : **hPanel → Node.js Web App → Import Git Repository**,
domaine **benintopbuilders.com**, MongoDB **déjà en ligne** (Atlas, etc.).

Guide complet : [`deploy/DEPLOY_HOSTINGER.md`](deploy/DEPLOY_HOSTINGER.md) ·
Checklist : [`deploy/GO_LIVE.md`](deploy/GO_LIVE.md) ·
Variables hPanel : [`deploy/hostinger-hpanel.env.example`](deploy/hostinger-hpanel.env.example)

Résumé hPanel :

| Champ | Valeur |
|-------|--------|
| Build command | `npm run build` |
| Start command | `npm start` |
| Node.js | 20 |
| Variables | `MONGODB_URI`, `JWT_*`, `VITE_API_URL=/api`, `CLIENT_URL`, etc. |

Chaque `git push` sur `main` redéploie automatiquement.

## Mise en production (checklist)

- [ ] Variables hPanel complètes (`deploy/hostinger-hpanel.env.example`)
- [ ] `MONGODB_URI` → base MongoDB en ligne + IP Hostinger autorisée
- [ ] Domaine benintopbuilders.com en HTTPS
- [ ] `/api/health` OK
- [ ] Seed superadmin exécuté une fois (`node server/src/jobs/seed.js`)
- [ ] Secrets JWT / FSPay réels
- [ ] SMTP réel (sinon OTP visible à l'écran)
- [ ] `FSPAY_BASE_URL` + clés quand le paiement est actif
- [ ] `CORS_ORIGINS` = `https://benintopbuilders.com,https://www.benintopbuilders.com`

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
