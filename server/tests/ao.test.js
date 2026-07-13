import mongoose from 'mongoose';
import { connectMongo } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { AppelOffre } from '../src/models/AppelOffre.js';
import { ReponseAO } from '../src/models/ReponseAO.js';
import { hashPassword } from '../src/utils/crypto.js';
import {
  createAO,
  deposerReponse,
  listAO,
  updateReponseStatut,
} from '../src/services/ao.service.js';

function addDays(n) {
  return new Date(Date.now() + n * 86400000);
}
function subDays(n) {
  return new Date(Date.now() - n * 86400000);
}
function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function makeUser(email, overrides = {}) {
  return User.create({
    email,
    passwordHash: await hashPassword('Password123!'),
    role: 'membre',
    statut: 'actif',
    profilType: 'artisan',
    prenom: 'Test',
    nom: 'User',
    telephone: '+22991000000',
    entreprise: email,
    departement: 'Littoral',
    ville: 'Cotonou',
    slug: email.replace(/[@.]/g, '-'),
    fichePubliee: true,
    metiers: ['maconnerie'],
    palier: 'standard',
    ...overrides,
  });
}

beforeAll(async () => {
  await connectMongo();
});

beforeEach(async () => {
  await User.deleteMany({ email: /ao\.example\.bj$/ });
  await AppelOffre.deleteMany({});
  await ReponseAO.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Appels d\'offres', () => {
  it('applique le quota Découverte 2/mois (403 QUOTA_ATTEINT)', async () => {
    const auteur = await makeUser('auteur@ao.example.bj', { profilType: 'maitre_ouvrage' });
    const disc = await makeUser('disco@ao.example.bj', {
      palier: 'decouverte',
      reponsesAoCeMois: 0,
      reponsesAoMoisCle: monthKey(),
    });

    const aos = [];
    for (let i = 0; i < 3; i += 1) {
      aos.push(
        await createAO(auteur, {
          titre: `Chantier test ${i} — villa`,
          description: 'Description détaillée du besoin de construction pour tests.',
          categorie: 'maconnerie',
          departement: 'Littoral',
          ville: 'Cotonou',
          surDevis: true,
          dateCloture: addDays(10),
        })
      );
    }
    for (const ao of aos) {
      ao.publishedAt = subDays(2);
      await ao.save();
    }

    await deposerReponse(disc, aos[0]._id, {
      montant: 1000000,
      delaiJours: 30,
      memoireTechnique: 'Mémoire technique détaillé pour le premier AO de test.',
    });
    await deposerReponse(disc, aos[1]._id, {
      montant: 1100000,
      delaiJours: 28,
      memoireTechnique: 'Mémoire technique détaillé pour le second AO de test.',
    });

    await expect(
      deposerReponse(disc, aos[2]._id, {
        montant: 1200000,
        delaiJours: 25,
        memoireTechnique: 'Mémoire technique détaillé pour le troisième AO de test.',
      })
    ).rejects.toMatchObject({ status: 403, code: 'QUOTA_ATTEINT' });
  });

  it('masque les AO récents aux non-Premium', async () => {
    const auteur = await makeUser('auteur2@ao.example.bj');
    const standard = await makeUser('std@ao.example.bj', { palier: 'standard' });
    const premium = await makeUser('prem@ao.example.bj', { palier: 'premium' });

    const ao = await createAO(auteur, {
      titre: 'AO premium early — gros oeuvre',
      description: 'Description assez longue pour validation zod métier.',
      categorie: 'maconnerie',
      departement: 'Littoral',
      dateCloture: addDays(7),
    });
    // published now — within 24h

    const forStd = await listAO(standard, {});
    const forPrem = await listAO(premium, {});
    expect(forStd.find((a) => String(a._id) === String(ao._id))).toBeFalsy();
    expect(forPrem.find((a) => String(a._id) === String(ao._id))).toBeTruthy();
  });

  it('refuse une seconde réponse (409) et attribue en cascade', async () => {
    const auteur = await makeUser('auteur3@ao.example.bj');
    const m1 = await makeUser('m1@ao.example.bj', { palier: 'premium' });
    const m2 = await makeUser('m2@ao.example.bj', { palier: 'premium' });

    const ao = await createAO(auteur, {
      titre: 'AO attribution cascade test chantier',
      description: 'Description pour tester l attribution en cascade des reponses.',
      categorie: 'maconnerie',
      departement: 'Littoral',
      dateCloture: addDays(7),
    });

    const r1 = await deposerReponse(m1, ao._id, {
      montant: 900000,
      delaiJours: 20,
      memoireTechnique: 'Mémoire technique membre un pour attribution.',
    });
    await deposerReponse(m2, ao._id, {
      montant: 950000,
      delaiJours: 22,
      memoireTechnique: 'Mémoire technique membre deux pour attribution.',
    });

    await expect(
      deposerReponse(m1, ao._id, {
        montant: 800000,
        delaiJours: 15,
        memoireTechnique: 'Deuxième tentative interdite sur le même AO.',
      })
    ).rejects.toMatchObject({ status: 409, code: 'DUPLICATE_RESPONSE' });

    await updateReponseStatut(auteur._id, r1._id, 'retenue');
    const others = await ReponseAO.find({ aoId: ao._id, _id: { $ne: r1._id } });
    expect(others.every((r) => r.statut === 'non_retenue')).toBe(true);
    const refreshed = await AppelOffre.findById(ao._id);
    expect(refreshed.statut).toBe('attribue');
    expect(String(refreshed.attribueA)).toBe(String(m1._id));
  });
});
