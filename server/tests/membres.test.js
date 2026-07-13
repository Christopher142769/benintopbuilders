import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectMongo } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/utils/crypto.js';

const app = createApp();

beforeAll(async () => {
  await connectMongo();
  await User.deleteMany({ email: /annuaire\.example\.bj$/ });

  await User.create([
    {
      email: 'or@annuaire.example.bj',
      passwordHash: await hashPassword('Password123!'),
      role: 'membre',
      statut: 'actif',
      profilType: 'entreprise_btp',
      palier: 'premium',
      prenom: 'Or',
      nom: 'Premium',
      telephone: '+22961111111',
      email_secret: true,
      entreprise: 'Or Bâtiment SA',
      departement: 'Littoral',
      ville: 'Cotonou',
      metiers: ['maconnerie'],
      fichePubliee: true,
      disponible: true,
      slug: 'or-batiment-sa',
      label: { niveau: 'or', obtenuAt: new Date() },
      noteMoyenne: 4.2,
      localisation: { type: 'Point', coordinates: [2.433, 6.367] },
    },
    {
      email: 'bronze@annuaire.example.bj',
      passwordHash: await hashPassword('Password123!'),
      role: 'membre',
      statut: 'actif',
      profilType: 'artisan',
      palier: 'decouverte',
      prenom: 'Bronze',
      nom: 'Artisan',
      telephone: '+22962222222',
      entreprise: 'Atelier Bronze',
      departement: 'Atlantique',
      ville: 'Abomey-Calavi',
      metiers: ['electricite'],
      fichePubliee: true,
      disponible: true,
      slug: 'atelier-bronze',
      label: { niveau: 'bronze', obtenuAt: new Date() },
      noteMoyenne: 4.8,
      localisation: { type: 'Point', coordinates: [2.35, 6.45] },
    },
  ]);
});

afterAll(async () => {
  await User.deleteMany({ email: /annuaire\.example\.bj$/ });
  await mongoose.connection.close();
});

describe('Annuaire membres', () => {
  it('filtre et trie label > premium > note, sans exposer email/téléphone/localisation', async () => {
    const res = await request(app).get('/api/membres').query({ metier: 'maconnerie' });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const first = res.body.data[0];
    expect(first.entreprise).toBe('Or Bâtiment SA');
    expect(first.email).toBeUndefined();
    expect(first.telephone).toBeUndefined();
    expect(first.localisation).toBeUndefined();
    expect(first.passwordHash).toBeUndefined();
  });

  it('recherche combinée département + label', async () => {
    const res = await request(app)
      .get('/api/membres')
      .query({ departement: 'Atlantique', label: 'bronze' });
    expect(res.status).toBe(200);
    expect(res.body.data.every((m) => m.label?.niveau === 'bronze')).toBe(true);
  });

  it('near ne renvoie pas de coordonnées', async () => {
    const res = await request(app)
      .get('/api/membres/near')
      .query({ lng: 2.43, lat: 6.37, maxDistance: 50000 });
    expect(res.status).toBe(200);
    for (const m of res.body.data) {
      expect(m.localisation).toBeUndefined();
      expect(m.email).toBeUndefined();
      expect(m.telephone).toBeUndefined();
    }
  });
});
