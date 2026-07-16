# Go-live Hostinger — checklist (Node.js Web App + GitHub)

Checklist rapide pour **benintopbuilders.com** avec MongoDB déjà en ligne.
Guide détaillé : [`DEPLOY_HOSTINGER.md`](./DEPLOY_HOSTINGER.md)

## Avant

- [ ] Plan Hostinger Business ou Cloud (Node.js Web App)
- [ ] Dépôt GitHub à jour (`benintopbuilders`)
- [ ] URI MongoDB en ligne prête (`MONGODB_URI`)
- [ ] IP Hostinger autorisée dans MongoDB Atlas (Network Access)
- [ ] Domaine **benintopbuilders.com** dans Hostinger

## hPanel — création

1. **Websites** → **Add Website** → **Node.js Web App**
2. Domaine : **benintopbuilders.com**
3. **Import Git Repository** → GitHub → repo `benintopbuilders` → branche `main`
4. Build : `npm run build` · Start : `npm start` · Node **20**
5. **Environment Variables** : copier depuis [`hostinger-hpanel.env.example`](./hostinger-hpanel.env.example)
   - Remplacer `MONGODB_URI` par votre URI MongoDB en ligne
   - Générer secrets : `bash deploy/generate-secrets.sh` (en local)
   - `VITE_API_URL=/api` · `VITE_SOCKET_URL=` (vide)
6. **Deploy**

## Après le 1er déploiement

```bash
# Terminal hPanel ou SSH — une seule fois
node server/src/jobs/seed.js
```

## Validation

- [ ] https://benintopbuilders.com charge la landing
- [ ] https://benintopbuilders.com/api/health → `success: true`
- [ ] https://benintopbuilders.com/admin/connexion fonctionne
- [ ] Connexion superadmin OK
- [ ] Messagerie (WebSocket) OK

## Mises à jour

```bash
git push origin main   # redéploiement auto Hostinger
```

## Après go-live

- [ ] Changer le mot de passe superadmin
- [ ] SMTP réel dans hPanel
- [ ] FSPay quand prêt
