import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectMongo } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Otp } from '../src/models/Otp.js';
import { __devOtpStore } from '../src/services/auth.service.js';

const app = createApp();

const baseRegister = {
  profilType: 'artisan',
  email: 'nouvel.artisan@example.bj',
  password: 'Password123!',
  prenom: 'Kofi',
  nom: 'Mensah',
  telephone: '+22997000001',
  entreprise: 'Atelier Mensah',
  departement: 'Littoral',
  ville: 'Cotonou',
  zonesIntervention: ['Cotonou', 'Abomey-Calavi'],
  presentation: 'Maçonnerie et finitions.',
  metiers: ['maconnerie'],
};

beforeAll(async () => {
  await connectMongo();
});

beforeEach(async () => {
  await User.deleteMany({ email: /example\.bj$/ });
  await Otp.deleteMany({ email: /example\.bj$/ });
  __devOtpStore.clear();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Parcours adhésion register → otp → charte → login', () => {
  it('exécute le flux complet jusqu\'à l\'activation Découverte', async () => {
    const reg = await request(app).post('/api/auth/register').send(baseRegister);
    expect(reg.status).toBe(201);
    expect(reg.body.success).toBe(true);
    expect(reg.body.data.user.statut).toBe('pending_otp');

    const code = __devOtpStore.get(baseRegister.email);
    expect(code).toMatch(/^\d{6}$/);

    const otp = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email: baseRegister.email, code });
    expect(otp.status).toBe(200);
    expect(otp.body.data.user.statut).toBe('pending_charte');
    expect(otp.body.data.accessToken).toBeTruthy();

    const token = otp.body.data.accessToken;

    const charte = await request(app)
      .post('/api/auth/charte/accept')
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(charte.status).toBe(200);
    expect(charte.body.data.user.statut).toBe('pending_paiement');
    expect(charte.body.data.user.charteAccepteeAt).toBeTruthy();

    const palier = await request(app)
      .post('/api/auth/adhesion/palier')
      .set('Authorization', `Bearer ${token}`)
      .send({ palier: 'decouverte' });
    expect(palier.status).toBe(200);
    expect(palier.body.data.user.statut).toBe('actif');
    expect(palier.body.data.user.role).toBe('membre');
    expect(palier.body.data.needsPayment).toBe(false);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: baseRegister.email, password: baseRegister.password });
    expect(login.status).toBe(200);
    expect(login.body.data.user.statut).toBe('actif');
    expect(login.body.data.redirect).toBe('/dashboard');
    expect(login.headers['set-cookie']?.some((c) => c.startsWith('btb_refresh='))).toBe(true);
  });

  it('refuse un OTP incorrect et limite les essais', async () => {
    await request(app).post('/api/auth/register').send(baseRegister);

    for (let i = 0; i < 6; i += 1) {
      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email: baseRegister.email, code: '000000' });
      if (i < 5) {
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('OTP_INVALID');
      } else {
        expect(res.status).toBe(429);
        expect(res.body.error.code).toBe('OTP_MAX_ATTEMPTS');
      }
    }
  });

  it('refuse un e-mail déjà inscrit', async () => {
    await request(app).post('/api/auth/register').send(baseRegister);
    const again = await request(app).post('/api/auth/register').send(baseRegister);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('EMAIL_EXISTS');
  });
});
