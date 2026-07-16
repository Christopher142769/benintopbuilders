import { Formation } from '../models/Formation.js';
import { ProgressionFormation } from '../models/ProgressionFormation.js';
import { InscriptionFormation } from '../models/InscriptionFormation.js';
import { DossierLabel } from '../models/DossierLabel.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/apiResponse.js';

const sameId = (a, b) => String(a) === String(b);

function allChapters(formation) {
  return formation.modules
    .filter((module) => module.actif)
    .sort((a, b) => a.ordre - b.ordre)
    .flatMap((module) =>
      module.chapitres
        .filter((chapter) => chapter.actif)
        .sort((a, b) => a.ordre - b.ordre)
        .map((chapter) => ({ module, chapter }))
    );
}

function publicEvaluation(evaluation) {
  if (!evaluation) return undefined;
  return {
    _id: evaluation._id,
    titre: evaluation.titre,
    instructions: evaluation.instructions,
    notePassage: evaluation.notePassage,
    tentativesMax: evaluation.tentativesMax,
    questions: evaluation.questions.map((question) => ({
      _id: question._id,
      intitule: question.intitule,
      type: question.type,
      options: question.options,
      points: question.points,
    })),
  };
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function scoreAnswers(evaluation, answers = [], files = {}) {
  const answerMap = new Map(answers.map((answer) => [String(answer.questionId), answer.valeur]));
  let earned = 0;
  let possible = 0;
  let manual = false;
  const responses = evaluation.questions.map((question) => {
    const id = String(question._id);
    const max = question.points;
    const value = answerMap.get(id);
    const file = files[id];
    let points = 0;
    let correctionManuelle = false;
    possible += max;

    if (question.type === 'choix_unique') {
      points = normalize(value) === normalize(question.reponsesCorrectes[0]) ? max : 0;
    } else if (question.type === 'choix_multiple') {
      const given = (Array.isArray(value) ? value : []).map(normalize).sort();
      const expected = question.reponsesCorrectes.map(normalize).sort();
      points =
        given.length === expected.length && given.every((item, index) => item === expected[index])
          ? max
          : 0;
    } else if (question.type === 'texte_libre') {
      const text = normalize(value);
      const keywords = question.motsCles.map(normalize).filter(Boolean);
      points =
        keywords.length === 0
          ? 0
          : max * (keywords.filter((keyword) => text.includes(keyword)).length / keywords.length);
    } else {
      correctionManuelle = true;
      manual = true;
    }
    earned += points;
    return {
      questionId: question._id,
      valeur: value,
      fichierUrl: file?.url,
      nomFichier: file?.nomOriginal,
      pointsObtenus: Math.round(points * 100) / 100,
      pointsMax: max,
      correctionManuelle,
    };
  });
  return {
    responses,
    earned,
    possible,
    score: possible ? Math.round((earned / possible) * 100) : 100,
    manual,
  };
}

async function assertAccess(userId, formation) {
  let inscription = await InscriptionFormation.findOne({ formationId: formation._id, userId });
  if (inscription && ['confirmee', 'presente'].includes(inscription.statut)) return inscription;

  const required = await DossierLabel.exists({
    membreId: userId,
    formationsRequises: formation._id,
    statut: { $nin: ['rejete'] },
  });
  if (!required) {
    throw new AppError('Inscription requise pour accéder à cette formation', {
      status: 403,
      code: 'ENROLLMENT_REQUIRED',
    });
  }
  inscription = await InscriptionFormation.findOneAndUpdate(
    { formationId: formation._id, userId },
    {
      $set: { statut: 'confirmee', montant: 0, nbParticipants: 1 },
      $setOnInsert: { formationId: formation._id, userId },
    },
    { new: true, upsert: true }
  );
  return inscription;
}

async function finishFormation(progression, formation) {
  progression.statut = 'terminee';
  progression.pourcentage = 100;
  progression.termineAt = new Date();
  await progression.save();
  await InscriptionFormation.updateOne(
    { formationId: formation._id, userId: progression.userId },
    { $set: { statut: 'presente', presenceValideeAt: new Date() } }
  );
  await User.updateOne(
    { _id: progression.userId, 'certifications.formationId': { $ne: formation._id } },
    {
      $push: {
        certifications: {
          titre: formation.titre,
          organisme: 'Bénin Top Builders',
          dateObtention: new Date(),
          formationId: formation._id,
        },
      },
    }
  );
  await DossierLabel.updateMany(
    { membreId: progression.userId, formationsRequises: formation._id },
    { $addToSet: { formationsValidees: formation._id } }
  );
}

export async function trainerOverview(trainerId) {
  const formations = await Formation.find({ formateurId: trainerId });
  const ids = formations.map((formation) => formation._id);
  const [apprenants, terminees, corrections] = await Promise.all([
    ProgressionFormation.countDocuments({ formationId: { $in: ids } }),
    ProgressionFormation.countDocuments({ formationId: { $in: ids }, statut: 'terminee' }),
    ProgressionFormation.countDocuments({
      formationId: { $in: ids },
      'tentatives.statut': 'a_corriger',
    }),
  ]);
  return {
    formations: formations.length,
    publiees: formations.filter((formation) => formation.statutPublication === 'publie').length,
    apprenants,
    terminees,
    corrections,
    tauxReussite: apprenants ? Math.round((terminees / apprenants) * 100) : 0,
  };
}

export async function trainerFormations(trainerId) {
  return Formation.find({ formateurId: trainerId }).sort({ updatedAt: -1 });
}

export async function createTraining(trainer, payload) {
  const allowed = new Set(trainer.formateur?.niveauxLabels || []);
  if (payload.niveauxLabels.some((level) => !allowed.has(level))) {
    throw new AppError('Vous ne pouvez créer que les formations correspondant à vos labels', {
      status: 403,
      code: 'LEVEL_FORBIDDEN',
    });
  }
  return Formation.create({
    ...payload,
    formateurId: trainer._id,
    requiseLabelOr: payload.niveauxLabels.includes('or'),
    active: true,
    modules: [],
  });
}

export async function updateTraining(trainer, id, payload) {
  const formation = await Formation.findOne({ _id: id, formateurId: trainer._id });
  if (!formation) throw new AppError('Formation introuvable', { status: 404, code: 'NOT_FOUND' });
  if (payload.niveauxLabels) {
    const allowed = new Set(trainer.formateur?.niveauxLabels || []);
    if (payload.niveauxLabels.some((level) => !allowed.has(level))) {
      throw new AppError('Niveau de label non autorisé', { status: 403, code: 'LEVEL_FORBIDDEN' });
    }
  }
  Object.assign(formation, payload);
  await formation.save();
  return formation;
}

export async function addModule(trainer, formationId, payload) {
  const formation = await Formation.findOne({ _id: formationId, formateurId: trainer._id });
  if (!formation) throw new AppError('Formation introuvable', { status: 404, code: 'NOT_FOUND' });
  formation.modules.push({ ...payload, ordre: payload.ordre ?? formation.modules.length });
  await formation.save();
  return formation;
}

export async function updateModule(trainer, formationId, moduleId, payload) {
  const formation = await Formation.findOne({ _id: formationId, formateurId: trainer._id });
  const module = formation?.modules.id(moduleId);
  if (!module) throw new AppError('Module introuvable', { status: 404, code: 'NOT_FOUND' });
  Object.assign(module, payload);
  await formation.save();
  return formation;
}

export async function deleteModule(trainer, formationId, moduleId) {
  const formation = await Formation.findOne({ _id: formationId, formateurId: trainer._id });
  const module = formation?.modules.id(moduleId);
  if (!module) throw new AppError('Module introuvable', { status: 404, code: 'NOT_FOUND' });
  module.deleteOne();
  await formation.save();
  return formation;
}

export async function addChapter(trainer, formationId, moduleId, payload) {
  const formation = await Formation.findOne({ _id: formationId, formateurId: trainer._id });
  const module = formation?.modules.id(moduleId);
  if (!module) throw new AppError('Module introuvable', { status: 404, code: 'NOT_FOUND' });
  module.chapitres.push({ ...payload, ordre: payload.ordre ?? module.chapitres.length });
  await formation.save();
  return formation;
}

export async function updateChapter(trainer, formationId, moduleId, chapterId, payload) {
  const formation = await Formation.findOne({ _id: formationId, formateurId: trainer._id });
  const module = formation?.modules.id(moduleId);
  const chapter = module?.chapitres.id(chapterId);
  if (!chapter) throw new AppError('Chapitre introuvable', { status: 404, code: 'NOT_FOUND' });
  Object.assign(chapter, payload);
  await formation.save();
  return formation;
}

export async function deleteChapter(trainer, formationId, moduleId, chapterId) {
  const formation = await Formation.findOne({ _id: formationId, formateurId: trainer._id });
  const chapter = formation?.modules.id(moduleId)?.chapitres.id(chapterId);
  if (!chapter) throw new AppError('Chapitre introuvable', { status: 404, code: 'NOT_FOUND' });
  chapter.deleteOne();
  await formation.save();
  return formation;
}

export async function getLearningPath(userId, formationId) {
  const formation = await Formation.findById(formationId).populate('formateurId', 'prenom nom');
  if (!formation || formation.statutPublication !== 'publie') {
    throw new AppError('Formation indisponible', { status: 404, code: 'NOT_FOUND' });
  }
  await assertAccess(userId, formation);
  const progression = await ProgressionFormation.findOneAndUpdate(
    { formationId, userId },
    { $setOnInsert: { formationId, userId } },
    { new: true, upsert: true }
  );
  const completed = new Set(progression.chapitresTermines.map(String));
  let previousComplete = true;
  const modules = formation.modules
    .filter((module) => module.actif)
    .sort((a, b) => a.ordre - b.ordre)
    .map((module) => ({
      _id: module._id,
      titre: module.titre,
      description: module.description,
      ordre: module.ordre,
      chapitres: module.chapitres
        .filter((chapter) => chapter.actif)
        .sort((a, b) => a.ordre - b.ordre)
        .map((chapter) => {
          const termine = completed.has(String(chapter._id));
          const verrouille = !previousComplete;
          if (!termine) previousComplete = false;
          return {
            _id: chapter._id,
            titre: chapter.titre,
            description: chapter.description,
            ordre: chapter.ordre,
            dureeMinutes: chapter.dureeMinutes,
            contenuType: chapter.contenuType,
            contenu: verrouille ? undefined : chapter.contenu,
            ressourceUrl: verrouille ? undefined : chapter.ressourceUrl,
            nomFichier: verrouille ? undefined : chapter.nomFichier,
            evaluation: verrouille ? undefined : publicEvaluation(chapter.evaluation),
            termine,
            verrouille,
          };
        }),
    }));
  return {
    formation: {
      _id: formation._id,
      titre: formation.titre,
      description: formation.description,
      niveauxLabels: formation.niveauxLabels,
      formateur: formation.formateurId,
      modules,
      examenFinal: previousComplete ? publicEvaluation(formation.examenFinal) : undefined,
    },
    progression,
  };
}

export async function completeChapter(userId, formationId, chapterId) {
  const formation = await Formation.findById(formationId);
  if (!formation) throw new AppError('Formation introuvable', { status: 404, code: 'NOT_FOUND' });
  await assertAccess(userId, formation);
  const path = allChapters(formation);
  const index = path.findIndex(({ chapter }) => sameId(chapter._id, chapterId));
  if (index < 0) throw new AppError('Chapitre introuvable', { status: 404, code: 'NOT_FOUND' });
  const progression = await ProgressionFormation.findOneAndUpdate(
    { formationId, userId },
    { $setOnInsert: { formationId, userId } },
    { new: true, upsert: true }
  );
  const completed = new Set(progression.chapitresTermines.map(String));
  if (path.slice(0, index).some(({ chapter }) => !completed.has(String(chapter._id)))) {
    throw new AppError('Terminez les chapitres précédents', { status: 422, code: 'CHAPTER_LOCKED' });
  }
  if (path[index].chapter.evaluation?.questions?.length) {
    throw new AppError('Le test de fin de chapitre doit être réussi', {
      status: 422,
      code: 'QUIZ_REQUIRED',
    });
  }
  if (!completed.has(String(chapterId))) progression.chapitresTermines.push(chapterId);
  progression.pourcentage = Math.round((progression.chapitresTermines.length / path.length) * 100);
  await progression.save();
  if (progression.chapitresTermines.length === path.length && !formation.examenFinal?.questions?.length) {
    await finishFormation(progression, formation);
  }
  return progression;
}

export async function submitEvaluation(userId, formationId, { type, chapterId, answers, files }) {
  const formation = await Formation.findById(formationId);
  if (!formation) throw new AppError('Formation introuvable', { status: 404, code: 'NOT_FOUND' });
  await assertAccess(userId, formation);
  const progression = await ProgressionFormation.findOneAndUpdate(
    { formationId, userId },
    { $setOnInsert: { formationId, userId } },
    { new: true, upsert: true }
  );
  const path = allChapters(formation);
  let evaluation;
  if (type === 'final') {
    if (progression.chapitresTermines.length !== path.length) {
      throw new AppError('Tous les chapitres doivent être terminés', {
        status: 422,
        code: 'COURSE_INCOMPLETE',
      });
    }
    evaluation = formation.examenFinal;
  } else {
    const index = path.findIndex(({ chapter }) => sameId(chapter._id, chapterId));
    if (index < 0) throw new AppError('Chapitre introuvable', { status: 404, code: 'NOT_FOUND' });
    const complete = new Set(progression.chapitresTermines.map(String));
    if (path.slice(0, index).some(({ chapter }) => !complete.has(String(chapter._id)))) {
      throw new AppError('Chapitre verrouillé', { status: 422, code: 'CHAPTER_LOCKED' });
    }
    evaluation = path[index].chapter.evaluation;
  }
  if (!evaluation?.questions?.length) {
    throw new AppError('Évaluation introuvable', { status: 404, code: 'NOT_FOUND' });
  }
  const attempts = progression.tentatives.filter(
    (attempt) => attempt.type === type && (type === 'final' || sameId(attempt.chapitreId, chapterId))
  );
  if (attempts.length >= evaluation.tentativesMax) {
    throw new AppError('Nombre maximal de tentatives atteint', {
      status: 422,
      code: 'MAX_ATTEMPTS',
    });
  }
  const result = scoreAnswers(evaluation, answers, files);
  const passed = !result.manual && result.score >= evaluation.notePassage;
  progression.tentatives.push({
    type,
    chapitreId: type === 'chapitre' ? chapterId : undefined,
    reponses: result.responses,
    score: result.score,
    reussi: passed,
    statut: result.manual ? 'a_corriger' : 'corrigee',
  });
  if (result.manual) {
    progression.statut = 'a_corriger';
  } else if (passed && type === 'chapitre') {
    if (!progression.chapitresTermines.some((id) => sameId(id, chapterId))) {
      progression.chapitresTermines.push(chapterId);
    }
    progression.pourcentage = Math.round((progression.chapitresTermines.length / path.length) * 100);
  } else if (passed && type === 'final') {
    progression.scoreFinal = result.score;
  }
  await progression.save();
  if (passed && type === 'final') await finishFormation(progression, formation);
  return {
    score: result.score,
    reussi: passed,
    correctionManuelle: result.manual,
    progression,
  };
}

export async function pendingCorrections(trainerId) {
  const formations = await Formation.find({ formateurId: trainerId }).select('_id titre');
  const ids = formations.map((formation) => formation._id);
  return ProgressionFormation.find({
    formationId: { $in: ids },
    'tentatives.statut': 'a_corriger',
  })
    .populate('userId', 'prenom nom email entreprise')
    .populate('formationId', 'titre');
}

export async function correctAttempt(trainerId, progressionId, attemptId, pointsByQuestion) {
  const progression = await ProgressionFormation.findById(progressionId).populate('formationId');
  if (!progression || !sameId(progression.formationId.formateurId, trainerId)) {
    throw new AppError('Correction introuvable', { status: 404, code: 'NOT_FOUND' });
  }
  const attempt = progression.tentatives.id(attemptId);
  if (!attempt || attempt.statut !== 'a_corriger') {
    throw new AppError('Tentative déjà corrigée ou introuvable', { status: 422, code: 'INVALID_STATUS' });
  }
  attempt.reponses.forEach((response) => {
    if (response.correctionManuelle) {
      const points = Number(pointsByQuestion[String(response.questionId)] ?? 0);
      response.pointsObtenus = Math.max(0, Math.min(response.pointsMax, points));
      response.correctionManuelle = false;
    }
  });
  const total = attempt.reponses.reduce((sum, response) => sum + response.pointsMax, 0);
  const earned = attempt.reponses.reduce((sum, response) => sum + response.pointsObtenus, 0);
  attempt.score = total ? Math.round((earned / total) * 100) : 100;
  const evaluation =
    attempt.type === 'final'
      ? progression.formationId.examenFinal
      : allChapters(progression.formationId).find(({ chapter }) =>
          sameId(chapter._id, attempt.chapitreId)
        )?.chapter.evaluation;
  attempt.reussi = attempt.score >= (evaluation?.notePassage ?? 70);
  attempt.statut = 'validee';
  attempt.corrigePar = trainerId;
  attempt.corrigeAt = new Date();
  if (attempt.reussi && attempt.type === 'chapitre') {
    if (!progression.chapitresTermines.some((id) => sameId(id, attempt.chapitreId))) {
      progression.chapitresTermines.push(attempt.chapitreId);
    }
  }
  progression.statut = 'en_cours';
  await progression.save();
  if (attempt.reussi && attempt.type === 'final') {
    progression.scoreFinal = attempt.score;
    await finishFormation(progression, progression.formationId);
  }
  return progression;
}
