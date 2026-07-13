import { assertTransition, DOSSIER_TRANSITIONS, creerDossier, transitionDossier } from '../src/services/label.service.js';
import { connectMongo } from '../src/config/db.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { DossierLabel } from '../src/models/DossierLabel.js';
import { Paiement } from '../src/models/Paiement.js';
import { hashPassword } from '../src/utils/crypto.js';
import { traiterWebhook } from '../src/services/paiement.service.js';

beforeAll(async () => {
  await connectMongo();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Labellisation — machine à états', () => {
  it('refuse les transitions invalides', () => {
    expect(() => assertTransition('soumis', 'valide')).toThrow();
    expect(() => assertTransition('valide', 'en_examen')).toThrow();
    expect(() => assertTransition('soumis', 'en_examen')).not.toThrow();
  });

  it('expose les transitions prévues', () => {
    expect(DOSSIER_TRANSITIONS.en_examen).toContain('visite_programmee');
    expect(DOSSIER_TRANSITIONS.pieces_manquantes).toContain('en_examen');
  });

  it('rend le dossier visible après paiement audit', async () => {
    await User.deleteMany({ email: 'label@example.bj' });
    await DossierLabel.deleteMany({});
    await Paiement.deleteMany({ type: 'labellisation' });

    const user = await User.create({
      email: 'label@example.bj',
      passwordHash: await hashPassword('Password123!'),
      role: 'membre',
      statut: 'actif',
      profilType: 'entreprise_btp',
      prenom: 'Label',
      nom: 'Test',
      telephone: '+22990000000',
      entreprise: 'Label SA',
      departement: 'Littoral',
      ville: 'Cotonou',
      slug: `label-sa-${Date.now()}`,
      fichePubliee: true,
    });

    const { dossier, paiement } = await creerDossier(user, {
      niveauDemande: 'bronze',
      pieces: [{ type: 'ifu', url: '/uploads/dossiers/ifu.webp' }],
    });

    expect(dossier.statut).toBe('soumis');

    await traiterWebhook({
      refInterne: paiement.refInterne,
      status: 'success',
      eventId: `label-pay-${Date.now()}`,
    });

    const listed = await DossierLabel.find({ statut: 'soumis' });
    expect(listed.some((d) => String(d._id) === String(dossier._id))).toBe(true);

    const advanced = await transitionDossier(dossier._id, {
      to: 'en_examen',
      adminId: user._id,
    });
    expect(advanced.statut).toBe('en_examen');

    await expect(
      transitionDossier(dossier._id, { to: 'soumis', adminId: user._id })
    ).rejects.toMatchObject({ status: 422 });
  });
});
