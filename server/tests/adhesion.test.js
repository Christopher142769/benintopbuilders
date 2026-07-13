import mongoose from 'mongoose';
import { connectMongo } from '../src/config/db.js';
import { runAdhesionLifecycle } from '../src/services/adhesion.service.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/utils/crypto.js';
import { Notification } from '../src/models/Notification.js';

beforeAll(async () => {
  await connectMongo();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Cycle adhésion', () => {
  beforeEach(async () => {
    await User.deleteMany({ email: /adh\.example\.bj$/ });
    await Notification.deleteMany({});
  });

  it('rappelle J-15, ignore J-0 gratuit, expire à J+7', async () => {
    const now = new Date('2026-07-13T12:00:00Z');

    const j15 = new Date(now);
    j15.setDate(j15.getDate() + 15);

    await User.create({
      email: 'rappel@adh.example.bj',
      passwordHash: await hashPassword('Password123!'),
      role: 'membre',
      statut: 'actif',
      profilType: 'artisan',
      prenom: 'Rappel',
      nom: 'Test',
      telephone: '+22990000001',
      departement: 'Littoral',
      ville: 'Cotonou',
      slug: `rappel-${Date.now()}`,
      palier: 'standard',
      adhesionExpireAt: j15,
      fichePubliee: true,
    });

    const expiredDate = new Date(now);
    expiredDate.setDate(expiredDate.getDate() - 8);
    await User.create({
      email: 'expire@adh.example.bj',
      passwordHash: await hashPassword('Password123!'),
      role: 'membre',
      statut: 'actif',
      profilType: 'artisan',
      prenom: 'Expire',
      nom: 'Test',
      telephone: '+22990000002',
      departement: 'Littoral',
      ville: 'Cotonou',
      slug: `expire-${Date.now()}`,
      palier: 'standard',
      adhesionExpireAt: expiredDate,
      fichePubliee: true,
    });

    const result = await runAdhesionLifecycle(now);
    expect(result.rappels).toBeGreaterThanOrEqual(1);
    expect(result.expires).toBeGreaterThanOrEqual(1);

    const expired = await User.findOne({ email: 'expire@adh.example.bj' });
    expect(expired.statut).toBe('expire');
    expect(expired.fichePubliee).toBe(false);
  });
});
