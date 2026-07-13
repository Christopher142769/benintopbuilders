# Bénin Top Builders

Écosystème numérique du BTP au Bénin — monorepo `client` (React/Vite) + `server` (Node/Express).

## Prérequis

- Node.js ≥ 20
- MongoDB local (optionnel pour le healthcheck de l'étape 1)

## Installation

```bash
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
```

## Développement

```bash
npm run dev
```

- Client : http://localhost:5173
- API : http://localhost:5001
- Health : http://localhost:5001/api/health

## Structure

```
/client   React 18 + Vite + Tailwind (design system BTB)
/server   Express + Mongoose + Pino
```
