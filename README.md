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
| Membres seed | divers `@…` du seed | `Password123!` |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Client + serveur |
| `npm run seed` | Jeu de données |
| `npm test` | Jest + Supertest |
| `npm run build` | Build client |

## Docker

```bash
docker compose up --build
```

Client nginx : http://localhost:8080 · API : http://localhost:5001

## Parcours de recette manuelle

1. **Adhésion** — Landing → Inscrire → OTP (logs serveur) → Charte → Découverte ou paiement sandbox Standard  
2. **Fiche + label** — Dashboard → Ma fiche → Demander labellisation → payer audit → admin `/admin/dossiers`  
3. **AO** — Publier besoin → répondre (quota Découverte) → retenir → messagerie  
4. **Marketplace** — `/materiaux` → panier → checkout FSPay → boutique fournisseur change statut  
5. **Formations** — Inscription + attestation après émargement admin  
6. **Messagerie** — Contacter depuis fiche ; contacts masqués si non actifs  
7. **Adhésion** — Renouvellement auto / historique `/dashboard/adhesion`  
8. **Admin** — Stats, membres, moderation, audit  

## Mise en production (checklist)

- [ ] HTTPS (reverse proxy)
- [ ] Secrets JWT / FSPay / webhook HMAC réels
- [ ] SMTP réel (plus de mode console)
- [ ] `FSPAY_BASE_URL` + clés API
- [ ] Sauvegardes MongoDB planifiées
- [ ] Monitoring des crons (clôture AO, stocks, adhésion 06:00)
- [ ] `CORS_ORIGINS` restreint au domaine public
- [ ] Uploads hors git, volume persistant
