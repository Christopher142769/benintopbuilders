import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectMongo } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Produit } from '../src/models/Produit.js';
import { Commande } from '../src/models/Commande.js';
import { hashPassword } from '../src/utils/crypto.js';
import { creerCommande, transitionCommande } from '../src/services/marketplace.service.js';

const app = createApp();

async function makeUser(email, overrides = {}) {
  return User.create({
    email,
    passwordHash: await hashPassword('Password123!'),
    role: 'membre',
    statut: 'actif',
    profilType: 'fournisseur',
    prenom: 'Vend',
    nom: 'Eur',
    telephone: '+22991000000',
    entreprise: email,
    departement: 'Littoral',
    ville: 'Cotonou',
    slug: email.replace(/[@.]/g, '-'),
    palier: 'fournisseur',
    fichePubliee: true,
    ...overrides,
  });
}

beforeAll(async () => {
  await connectMongo();
});

beforeEach(async () => {
  await User.deleteMany({ email: /mkt\.example\.bj$/ });
  await Produit.deleteMany({});
  await Commande.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Marketplace', () => {
  it('décrémente le stock de façon concurrente sans survente', async () => {
    const vendeur = await makeUser('vendeur@mkt.example.bj');
    const acheteur1 = await makeUser('a1@mkt.example.bj', {
      profilType: 'maitre_ouvrage',
      palier: 'standard',
    });
    const acheteur2 = await makeUser('a2@mkt.example.bj', {
      profilType: 'maitre_ouvrage',
      palier: 'standard',
    });

    const produit = await Produit.create({
      vendeurId: vendeur._id,
      nom: 'Ciment 50kg',
      categorie: 'ciment',
      prixUnitaire: 5000,
      stock: 5,
      actif: true,
    });

    const payload = {
      lignes: [{ produitId: produit._id, quantite: 4 }],
      adresseLivraison: { nom: 'Client', telephone: '+22990000000', ville: 'Cotonou' },
    };

    const results = await Promise.allSettled([
      creerCommande(acheteur1, payload),
      creerCommande(acheteur2, payload),
    ]);

    const ok = results.filter((r) => r.status === 'fulfilled');
    const ko = results.filter((r) => r.status === 'rejected');
    expect(ok.length).toBe(1);
    expect(ko.length).toBe(1);

    const refreshed = await Produit.findById(produit._id);
    expect(refreshed.stock).toBe(1);
  });

  it('refuse une transition invalide (422)', async () => {
    const vendeur = await makeUser('v2@mkt.example.bj');
    const acheteur = await makeUser('a3@mkt.example.bj', {
      profilType: 'maitre_ouvrage',
      palier: 'standard',
    });
    const produit = await Produit.create({
      vendeurId: vendeur._id,
      nom: 'Fer tor',
      categorie: 'fer',
      prixUnitaire: 8000,
      stock: 10,
    });

    const { commande } = await creerCommande(acheteur, {
      lignes: [{ produitId: produit._id, quantite: 1 }],
      adresseLivraison: { nom: 'X', telephone: '+22991111111', ville: 'Cotonou' },
    });

    await expect(transitionCommande(commande._id, vendeur, 'livree')).rejects.toMatchObject({
      status: 422,
      code: 'INVALID_TRANSITION',
    });
  });

  it('expose le catalogue public API', async () => {
    const vendeur = await makeUser('v3@mkt.example.bj');
    await Produit.create({
      vendeurId: vendeur._id,
      nom: 'Peinture acrylique',
      categorie: 'peinture',
      prixUnitaire: 12000,
      stock: 20,
    });
    const res = await request(app).get('/api/materiaux/produits').query({ categorie: 'peinture' });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
