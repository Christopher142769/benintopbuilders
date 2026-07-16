import mongoose from 'mongoose';
import { connectMongo } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Formation } from '../src/models/Formation.js';
import { InscriptionFormation } from '../src/models/InscriptionFormation.js';
import { ProgressionFormation } from '../src/models/ProgressionFormation.js';
import { hashPassword } from '../src/utils/crypto.js';
import {
  addChapter,
  addModule,
  completeChapter,
  createTraining,
  getLearningPath,
  submitEvaluation,
} from '../src/services/learning.service.js';

beforeAll(async () => {
  await connectMongo();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Parcours de formation séquentiel', () => {
  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({ email: /learning\.example\.bj$/ }),
      Formation.deleteMany({}),
      InscriptionFormation.deleteMany({}),
      ProgressionFormation.deleteMany({}),
    ]);
  });

  it('verrouille les chapitres puis certifie après les évaluations', async () => {
    const [trainer, member] = await User.create([
      {
        email: 'trainer@learning.example.bj',
        passwordHash: await hashPassword('Password123!'),
        role: 'formateur',
        statut: 'actif',
        prenom: 'Ama',
        nom: 'Coach',
        formateur: { niveauxLabels: ['bronze'], specialite: 'Qualité', actif: true },
      },
      {
        email: 'member@learning.example.bj',
        passwordHash: await hashPassword('Password123!'),
        role: 'membre',
        statut: 'actif',
        profilType: 'artisan',
        palier: 'standard',
        prenom: 'Koffi',
        nom: 'Pro',
      },
    ]);

    let formation = await createTraining(trainer, {
      titre: 'Fondamentaux qualité chantier',
      description: 'Parcours complet de validation des fondamentaux qualité.',
      modalite: 'en_ligne',
      dureeHeures: 2,
      niveauxLabels: ['bronze'],
      statutPublication: 'publie',
    });
    formation = await addModule(trainer, formation._id, {
      titre: 'Module initial',
      description: 'Les bases',
    });
    const moduleId = formation.modules[0]._id;
    formation = await addChapter(trainer, formation._id, moduleId, {
      titre: 'Sécurité',
      contenuType: 'texte',
      contenu: 'Cours',
      evaluation: {
        titre: 'Test sécurité',
        notePassage: 70,
        tentativesMax: 3,
        questions: [
          {
            intitule: 'Quel équipement est obligatoire ?',
            type: 'choix_unique',
            options: ['Casque', 'Sandales'],
            reponsesCorrectes: ['Casque'],
            points: 1,
          },
        ],
      },
    });
    formation = await addChapter(trainer, formation._id, moduleId, {
      titre: 'Contrôle final',
      contenuType: 'texte',
      contenu: 'Cours final',
    });
    formation.examenFinal = {
      titre: 'Certification Bronze',
      notePassage: 70,
      tentativesMax: 2,
      questions: [
        {
          intitule: 'Citez les notions attendues',
          type: 'texte_libre',
          motsCles: ['sécurité', 'qualité'],
          points: 2,
        },
      ],
    };
    await formation.save();
    await InscriptionFormation.create({
      formationId: formation._id,
      userId: member._id,
      montant: 0,
      statut: 'confirmee',
    });

    let path = await getLearningPath(member._id, formation._id);
    expect(path.formation.modules[0].chapitres[0].verrouille).toBe(false);
    expect(path.formation.modules[0].chapitres[1].verrouille).toBe(true);

    const firstId = formation.modules[0].chapitres[0]._id;
    await expect(completeChapter(member._id, formation._id, firstId)).rejects.toMatchObject({
      code: 'QUIZ_REQUIRED',
    });
    const quiz = formation.modules[0].chapitres[0].evaluation;
    const quizResult = await submitEvaluation(member._id, formation._id, {
      type: 'chapitre',
      chapterId: firstId,
      answers: [{ questionId: String(quiz.questions[0]._id), valeur: 'Casque' }],
      files: {},
    });
    expect(quizResult.reussi).toBe(true);

    const secondId = formation.modules[0].chapitres[1]._id;
    await completeChapter(member._id, formation._id, secondId);
    path = await getLearningPath(member._id, formation._id);
    expect(path.formation.examenFinal).toBeDefined();

    const finalResult = await submitEvaluation(member._id, formation._id, {
      type: 'final',
      answers: [
        {
          questionId: String(formation.examenFinal.questions[0]._id),
          valeur: 'La sécurité et la qualité sont prioritaires.',
        },
      ],
      files: {},
    });
    expect(finalResult.reussi).toBe(true);
    const inscription = await InscriptionFormation.findOne({
      formationId: formation._id,
      userId: member._id,
    });
    expect(inscription.statut).toBe('presente');
  });
});
