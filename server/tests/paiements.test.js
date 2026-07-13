import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectMongo } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Paiement } from '../src/models/Paiement.js';
import { hashPassword } from '../src/utils/crypto.js';
import {
  signWebhookPayload,
  initierPaiement,
  traiterWebhook,
} from '../src/services/paiement.service.js';
import { env } from '../src/config/env.js';

const app = createApp();

async function createPendingUser(email) {
  return User.create({
    email,
    passwordHash: await hashPassword('Password123!'),
    role: 'visiteur',
    statut: 'pending_paiement',
    profilType: 'entreprise_btp',
    prenom: 'Afi',
    nom: 'Koffi',
    telephone: '+22997000099',
    entreprise: 'BTP Koffi',
    departement: 'Littoral',
    ville: 'Cotonou',
    slug: `btp-koffi-${Date.now()}`,
    charteAccepteeAt: new Date(),
    emailVerifieAt: new Date(),
    palier: 'standard',
  });
}

beforeAll(async () => {
  await connectMongo();
});

beforeEach(async () => {
  await User.deleteMany({ email: /paiement\.example\.bj$/ });
  await Paiement.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Paiements FSPay webhook', () => {
  it('refuse une signature invalide (401)', async () => {
    const res = await request(app)
      .post('/api/paiements/webhook')
      .set('x-fspay-signature', 'signature-invalide')
      .send({ refInterne: 'BTB-ADHESION-2026-00001', status: 'success', eventId: 'e1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_SIGNATURE');
  });

  it('traite une seule fois un double webhook (idempotence)', async () => {
    const user = await createPendingUser('idempotence@paiement.example.bj');
    const { paiement } = await initierPaiement({
      userId: user._id,
      type: 'adhesion',
      montant: 50000,
      meta: { palier: 'standard' },
    });

    const body = {
      refInterne: paiement.refInterne,
      status: 'success',
      eventId: 'evt-unique-1',
      fspayRef: 'FSP-1',
    };
    const raw = JSON.stringify(body);
    const sig = signWebhookPayload(raw, env.fspayWebhookSecret);

    const first = await request(app)
      .post('/api/paiements/webhook')
      .set('Content-Type', 'application/json')
      .set('x-fspay-signature', sig)
      .send(body);
    expect(first.status).toBe(200);
    expect(first.body.data.alreadyProcessed).toBe(false);

    const second = await request(app)
      .post('/api/paiements/webhook')
      .set('Content-Type', 'application/json')
      .set('x-fspay-signature', signWebhookPayload(JSON.stringify(body), env.fspayWebhookSecret))
      .send(body);
    expect(second.status).toBe(200);
    expect(second.body.data.alreadyProcessed).toBe(true);

    const refreshed = await User.findById(user._id);
    expect(refreshed.statut).toBe('actif');
    expect(refreshed.palier).toBe('standard');
    expect(refreshed.role).toBe('membre');

    const count = await Paiement.countDocuments({
      userId: user._id,
      statut: 'reussi',
      type: 'adhesion',
    });
    expect(count).toBe(1);
  });

  it('active le compte Standard via sandbox (webhook simulé)', async () => {
    const user = await createPendingUser('sandbox@paiement.example.bj');
    const { paiement } = await initierPaiement({
      userId: user._id,
      type: 'adhesion',
      montant: 50000,
      meta: { palier: 'standard' },
    });

    await traiterWebhook({
      refInterne: paiement.refInterne,
      status: 'success',
      eventId: `manual-${Date.now()}`,
    });

    const refreshed = await User.findById(user._id);
    expect(refreshed.statut).toBe('actif');
    expect(refreshed.palier).toBe('standard');
  });
});
