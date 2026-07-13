import mongoose from 'mongoose';
import { connectMongo } from '../src/config/db.js';
import { creerAvis, inscrireFormation } from '../src/services/formations.service.js';
import { User } from '../src/models/User.js';
import { Formation } from '../src/models/Formation.js';
import { InscriptionFormation } from '../src/models/InscriptionFormation.js';
import { hashPassword } from '../src/utils/crypto.js';

beforeAll(async () => {
  await connectMongo();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Formations & avis', () => {
  beforeEach(async () => {
    await User.deleteMany({ email: /form\.example\.bj$/ });
    await Formation.deleteMany({});
    await InscriptionFormation.deleteMany({});
  });

  it('bloque la double inscription', async () => {
    const user = await User.create({
      email: 'u@form.example.bj',
      passwordHash: await hashPassword('Password123!'),
      role: 'membre',
      statut: 'actif',
      profilType: 'artisan',
      prenom: 'A',
      nom: 'B',
      telephone: '+22990000000',
      departement: 'Littoral',
      ville: 'Cotonou',
      slug: `u-${Date.now()}`,
      palier: 'standard',
    });
    const formation = await Formation.create({
      titre: 'Sécurité chantier',
      description: 'Formation sécurité',
      modalite: 'presentiel',
      dateDebut: new Date(Date.now() + 86400000),
      dateFin: new Date(Date.now() + 2 * 86400000),
      dureeHeures: 8,
      placesTotal: 20,
      placesRestantes: 20,
      tarifMembre: 0,
      tarifNonMembre: 10000,
    });

    await inscrireFormation(user, formation._id, 1);
    await expect(inscrireFormation(user, formation._id, 1)).rejects.toMatchObject({
      status: 409,
      code: 'DUPLICATE',
    });
  });

  it('refuse un avis hors contexte (403)', async () => {
    const auteur = await User.create({
      email: 'aut@form.example.bj',
      passwordHash: await hashPassword('Password123!'),
      role: 'membre',
      statut: 'actif',
      profilType: 'maitre_ouvrage',
      prenom: 'A',
      nom: 'B',
      telephone: '+22990000003',
      departement: 'Littoral',
      ville: 'Cotonou',
      slug: `aut-${Date.now()}`,
      palier: 'standard',
    });
    await expect(
      creerAvis(auteur, {
        cibleId: auteur._id,
        note: 5,
        commentaire: 'Top',
        contexte: { type: 'ao', refId: new mongoose.Types.ObjectId() },
      })
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });
});
