# Déploiement Hostinger — Node.js Web App + GitHub

Guide pour héberger **Bénin Top Builders** sur l’offre **Node.js Web App** de Hostinger :
connexion GitHub, déploiement automatique à chaque `git push`, domaine
**benintopbuilders.com**, MongoDB **déjà en ligne** (Atlas ou autre).

> Ce guide correspond au flux **hPanel → Add Website → Node.js Web App → Import Git Repository**.
> Pas besoin de Docker, PM2 manuel, ni d’installer MongoDB sur le serveur.

## Option A — Hostinger Connector (depuis Cursor)

Si vous avez installé **Hostinger Connector** dans Cursor :

1. **Connecter le compte** : barre latérale Hostinger (icône H) → **Connect** / OAuth
2. **Vérifier les outils MCP** : Cursor → **Settings** → **Tools & MCP** → serveurs `Hostinger Websites` en vert
3. **Pousser le code** sur GitHub (`git push origin main`)
4. Dans le chat Cursor, demander :
   > Déploie benintopbuilders sur Hostinger, domaine benintopbuilders.com, build `npm run build`, start `npm start`, Node 20, framework Express
5. **Configurer les variables d’environnement** dans hPanel (voir §3) — notamment `MONGODB_URI` et les secrets JWT
6. **Redéployer** après avoir ajouté les variables

Variables locales (non commitées) : `server/.env`  
Pour afficher la liste à coller dans hPanel : `bash deploy/print-hpanel-env.sh`

## Option B — hPanel manuel (GitHub)


```
benintopbuilders.com (HTTPS géré par Hostinger)
        │
        ▼
Node.js Web App (un seul processus Express)
        ├─ /api/*, /uploads/*, /socket.io/*  → API + messagerie temps réel
        └─ /*                                  → build React (client/dist)

MongoDB en ligne (Atlas / Hostinger) ←── MONGODB_URI dans hPanel
```

Hostinger installe les dépendances, exécute le build, démarre l’app et gère SSL/CDN.
Le code du dépôt est prêt pour ce flux (`postinstall`, `build`, `start` à la racine).

## Prérequis

- [ ] Plan Hostinger **Business** ou **Cloud** (Node.js Web App)
- [ ] Dépôt GitHub : `Christopher142769/benintopbuilders` (ou le vôtre)
- [ ] MongoDB en ligne avec URI de connexion (`mongodb+srv://...` ou `mongodb://...`)
- [ ] Domaine **benintopbuilders.com** ajouté dans Hostinger (DNS)

### MongoDB en ligne

Dans MongoDB Atlas (ou votre hébergeur MongoDB) :

1. Créer une base `benin-top-builders` (ou utiliser le nom dans l’URI)
2. Créer un utilisateur avec mot de passe
3. **Network Access** : autoriser l’accès depuis Hostinger
   - Option rapide : `0.0.0.0/0` (toutes IP) — acceptable si mot de passe fort
   - Option stricte : IP du serveur Hostinger (visible dans hPanel après 1er déploiement)
4. Copier l’URI complète → variable `MONGODB_URI` dans hPanel

## 1. Créer l’application Node.js dans hPanel

1. **hPanel** → **Websites** → **Add Website**
2. Choisir **Node.js Web App**
3. Sélectionner le domaine **benintopbuilders.com** (ou domaine temporaire puis bascule)
4. **Import Git Repository** → autoriser GitHub → sélectionner le dépôt `benintopbuilders`
5. Branche : `main` (ou `master`)

## 2. Commandes de build (Settings)

Vérifier / renseigner dans **Settings & Redeploy** :

| Champ | Valeur |
|-------|--------|
| **Framework** | Express.js (ou détection auto) |
| **Node.js version** | 20 |
| **Root directory** | `.` (racine du dépôt) |
| **Package manager** | npm |
| **Install command** | *(laisser vide — `npm install` à la racine + `postinstall`)* |
| **Build command** | `npm run build` |
| **Start command** | `npm start` |
| **Entry file** | `server/src/index.js` |

Le `postinstall` du `package.json` installe automatiquement `client/` et `server/`.
Le `build` compile le React dans `client/dist`.
Le `start` lance l’API qui sert aussi le frontend en production.

## 3. Variables d’environnement (hPanel)

**Environment Variables** → ajouter toutes les variables **avant le premier Deploy**.

Modèle complet : [`deploy/hostinger-hpanel.env.example`](./hostinger-hpanel.env.example)

Générer les secrets en local :

```bash
bash deploy/generate-secrets.sh
```

### Variables essentielles

| Variable | Exemple / valeur |
|----------|------------------|
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://benintopbuilders.com` |
| `CORS_ORIGINS` | `https://benintopbuilders.com,https://www.benintopbuilders.com` |
| `MONGODB_URI` | Votre URI MongoDB en ligne |
| `JWT_ACCESS_SECRET` | Secret généré (min. 32 caractères) |
| `JWT_REFRESH_SECRET` | Secret généré (min. 32 caractères) |
| `VITE_API_URL` | `/api` |
| `VITE_SOCKET_URL` | *(vide — même domaine)* |
| `VITE_APP_NAME` | `Bénin Top Builders` |
| `SEED_SUPERADMIN_EMAIL` | `superadmin@benintopbuilders.com` |
| `SEED_SUPERADMIN_PASSWORD` | Mot de passe fort |

> **Important** : les variables `VITE_*` doivent être définies **avant** le build.
> Si vous les modifiez après coup : **Settings & Redeploy** → redéployer.

Hostinger injecte ces variables dans `process.env` — pas besoin de fichier `.env` sur le serveur.

## 4. Lier le domaine benintopbuilders.com

1. hPanel → votre site Node.js → **Domain** / **Connect domain**
2. Sélectionner **benintopbuilders.com**
3. Vérifier les DNS (souvent déjà OK si le domaine est chez Hostinger) :
   - `A` `@` → IP Hostinger
   - `CNAME` `www` → `benintopbuilders.com` (ou enregistrement fourni par Hostinger)
4. SSL : activé automatiquement par Hostinger (Let's Encrypt)

Propagation DNS : quelques minutes à 24 h.

## 5. Premier déploiement

1. Cliquer **Deploy**
2. Suivre les logs : install → build client → start
3. Ouvrir `https://benintopbuilders.com/api/health` → doit retourner `{"success":true,...}`

En cas d’échec, consulter **Deployments** → log complet (souvent : `MONGODB_URI` invalide ou variables `VITE_*` manquantes).

## 6. Créer le superadmin (une fois)

Après un déploiement réussi, exécuter le seed **une seule fois** :

**Option A — Terminal hPanel** (si disponible sur votre plan) :

```bash
cd server
node src/jobs/seed.js
```

**Option B — SSH** (VPS ou accès SSH Hostinger) :

```bash
# depuis la racine du projet déployé
node server/src/jobs/seed.js
```

Le seed utilise `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` des variables hPanel.
Il ne crée **que** le superadmin — annuaire, AO, marketplace et formations restent vides.

Connexion admin : `https://benintopbuilders.com/admin/connexion`

## 7. Mises à jour (workflow Git)

Chaque push sur la branche connectée redéploie automatiquement :

```bash
git add .
git commit -m "Mise à jour plateforme"
git push origin main
```

Hostinger : pull → `npm install` → `npm run build` → `npm start`.

## URLs de production

| Page | URL |
|------|-----|
| Accueil | https://benintopbuilders.com |
| API health | https://benintopbuilders.com/api/health |
| Admin | https://benintopbuilders.com/admin/connexion |
| Formateur | https://benintopbuilders.com/formateur/connexion |

## Dépannage

| Symptôme | Solution |
|----------|----------|
| Build échoue sur `vite` | Vérifier `VITE_API_URL=/api` dans les variables d’environnement |
| Page blanche, API OK | Redéployer après avoir ajouté les `VITE_*` ; vérifier les logs de build |
| `MongoServerError` / timeout DB | Vérifier `MONGODB_URI` ; autoriser l’IP Hostinger dans MongoDB Atlas |
| 401 / CORS | `CLIENT_URL` et `CORS_ORIGINS` doivent être en `https://benintopbuilders.com` |
| Socket.io ne connecte pas | `VITE_SOCKET_URL` doit rester **vide** (même origine) |
| Uploads perdus après redeploy | Les fichiers dans `server/uploads/` peuvent être éphémères selon le plan — prévoir stockage persistant ou S3 si besoin |

## Checklist go-live

- [ ] Variables hPanel complètes (voir `hostinger-hpanel.env.example`)
- [ ] `MONGODB_URI` testée depuis Atlas
- [ ] Domaine benintopbuilders.com actif en HTTPS
- [ ] `/api/health` OK
- [ ] Seed superadmin exécuté
- [ ] Connexion admin OK
- [ ] Changer le mot de passe superadmin après 1ère connexion
- [ ] Configurer SMTP réel (sinon OTP visible à l’écran)
- [ ] Activer FSPay quand le paiement est prêt

## Alternative : VPS (accès root)

Si vous préférez un VPS avec PM2 + Nginx manuel (sans GitHub auto-deploy Hostinger),
voir le script [`deploy/deploy.sh`](./deploy.sh) et [`deploy/nginx-hostinger.conf`](./nginx-hostinger.conf).
