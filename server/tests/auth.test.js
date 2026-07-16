import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectMongo } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Otp } from '../src/models/Otp.js';
import { __devOtpStore } from '../src/services/auth.service.js';
import { hashPassword } from '../src/utils/crypto.js';

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
  zonesIntervention: JSON.stringify(['Cotonou', 'Abomey-Calavi']),
  presentation: 'Maçonnerie et finitions.',
  metiers: JSON.stringify(['maconnerie']),
};

const fakePdf = Buffer.from('%PDF-1.4 fake rccm document for tests');

function registerRequest(overrides = {}) {
  const data = { ...baseRegister, ...overrides };
  let req = request(app).post('/api/auth/register');
  for (const [key, value] of Object.entries(data)) {
    req = req.field(key, value);
  }
  return req.attach('rccm', fakePdf, {
    filename: 'rccm-atelier.pdf',
    contentType: 'application/pdf',
  });
}

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
    const reg = await registerRequest();
    expect(reg.status).toBe(201);
    expect(reg.body.success).toBe(true);
    expect(reg.body.data.user.statut).toBe('pending_otp');
    expect(reg.body.data.user.rccmDocumentUrl).toMatch(/^\/uploads\/rccm\//);

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

  it('refuse un inscription artisan sans fichier RCCM', async () => {
    const res = await request(app).post('/api/auth/register').send({
      profilType: 'artisan',
      email: 'sans.rccm@example.bj',
      password: 'Password123!',
      prenom: 'Sans',
      nom: 'Rccm',
      telephone: '+22997000002',
      departement: 'Littoral',
      ville: 'Cotonou',
    });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('RCCM_REQUIRED');
  });

  it('refuse un OTP incorrect et limite les essais', async () => {
    await registerRequest();

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
    await registerRequest();
    const again = await registerRequest();
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('EMAIL_EXISTS');
  });
});

describe('Modification du mot de passe connecté', () => {
  it('vérifie le mot de passe actuel et invalide l’ancien', async () => {
    await User.create({
      email: 'securite@example.bj',
      passwordHash: await hashPassword('Password123!'),
      role: 'admin',
      statut: 'actif',
      prenom: 'Admin',
      nom: 'Sécurité',
      telephone: '+22997000009',
      departement: 'Littoral',
      ville: 'Cotonou',
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'securite@example.bj', password: 'Password123!' });

    const changed = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({
        currentPassword: 'Password123!',
        newPassword: 'Nouveau456!',
        confirmPassword: 'Nouveau456!',
      });
    expect(changed.status).toBe(200);

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'securite@example.bj', password: 'Password123!' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'securite@example.bj', password: 'Nouveau456!' });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.data.redirect).toBe('/admin');
  });
});
