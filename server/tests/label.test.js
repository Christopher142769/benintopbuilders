import { assertTransition, DOSSIER_TRANSITIONS, creerDossier, transitionDossier } from '../src/services/label.service.js';
import { connectMongo } from '../src/config/db.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { DossierLabel } from '../src/models/DossierLabel.js';
import { Paiement } from '../src/models/Paiement.js';
import { hashPassword } from '../src/utils/crypto.js';
import { traiterWebhook } from '../src/services/paiement.service.js';
import { LabelFormulaire } from '../src/models/LabelFormulaire.js';

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
    await LabelFormulaire.deleteMany({ niveau: 'bronze' });
    await LabelFormulaire.create({
      niveau: 'bronze',
      titre: 'Formulaire Bronze',
      champs: [{ key: 'ifu', label: 'IFU', type: 'text', required: true }],
    });

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
      valeurs: { ifu: '123456789' },
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

  it('inclut les frais de label pour un abonnement payant', async () => {
    await DossierLabel.deleteMany({});
    await LabelFormulaire.deleteMany({ niveau: 'argent' });
    await LabelFormulaire.create({
      niveau: 'argent',
      titre: 'Formulaire Argent',
      champs: [{ key: 'experience', label: 'Expérience', type: 'number', required: true }],
    });
    const user = await User.create({
      email: `label-paid-${Date.now()}@example.bj`,
      passwordHash: await hashPassword('Password123!'),
      role: 'membre',
      statut: 'actif',
      palier: 'standard',
      profilType: 'entreprise_btp',
      prenom: 'Membre',
      nom: 'Payant',
      telephone: `+229${Date.now().toString().slice(-8)}`,
      entreprise: `Payant ${Date.now()}`,
      departement: 'Littoral',
      ville: 'Cotonou',
      slug: `payant-${Date.now()}`,
    });

    const result = await creerDossier(user, {
      niveauDemande: 'argent',
      valeurs: { experience: '8' },
    });

    expect(result.needsPayment).toBe(false);
    expect(result.fraisInclusAbonnement).toBe(true);
    expect(result.dossier.reponses[0].valeur).toBe(8);
    expect(result.dossier.paiementId).toBeUndefined();
  });
});
