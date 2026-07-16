import { z } from 'zod';
import { ok, created } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { saveDocument } from '../services/upload.service.js';
import * as learning from '../services/learning.service.js';

const levels = z.array(z.enum(['bronze', 'argent', 'or'])).min(1);

const questionSchema = z.object({
  intitule: z.string().min(2).max(500),
  type: z.enum(['choix_multiple', 'choix_unique', 'texte_libre', 'fichier']),
  options: z.array(z.string().min(1).max(300)).default([]),
  reponsesCorrectes: z.array(z.string().max(300)).default([]),
  motsCles: z.array(z.string().min(1).max(100)).default([]),
  points: z.coerce.number().min(0.5).max(100).default(1),
  explication: z.string().max(1000).optional(),
});

const evaluationSchema = z.object({
  titre: z.string().min(2).max(200).default('Évaluation'),
  instructions: z.string().max(2000).optional(),
  notePassage: z.coerce.number().min(0).max(100).default(70),
  tentativesMax: z.coerce.number().int().min(1).max(20).default(3),
  questions: z.array(questionSchema).min(1),
});

const trainingSchema = z.object({
  titre: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  modalite: z.enum(['presentiel', 'en_ligne', 'hybride']).default('en_ligne'),
  dureeHeures: z.coerce.number().min(0.5).max(1000).default(1),
  niveauxLabels: levels,
  statutPublication: z.enum(['brouillon', 'publie', 'archive']).default('brouillon'),
  dateDebut: z.coerce.date().optional(),
  dateFin: z.coerce.date().optional(),
  lieu: z.string().max(300).optional(),
});

const moduleSchema = z.object({
  titre: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  ordre: z.coerce.number().int().min(0).optional(),
  actif: z.boolean().optional(),
});

const chapterSchema = z.object({
  titre: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  ordre: z.coerce.number().int().min(0).optional(),
  contenuType: z.enum(['texte', 'document', 'youtube', 'zoom']),
  contenu: z.string().max(30000).optional(),
  ressourceUrl: z.string().max(2000).optional(),
  dureeMinutes: z.coerce.number().int().min(0).max(10000).default(0),
  evaluation: evaluationSchema.optional().nullable(),
  actif: z.boolean().optional(),
});

function parseMultipart(req) {
  if (typeof req.body.payload === 'string') return JSON.parse(req.body.payload);
  return req.body;
}

async function withDocument(req, payload) {
  if (!req.file) return payload;
  const file = await saveDocument(req.file, {
    folder: 'formations',
    filenamePrefix: 'cours',
  });
  return { ...payload, ressourceUrl: file.url, nomFichier: file.nomOriginal };
}

export const overview = asyncHandler(async (req, res) => {
  return ok(res, await learning.trainerOverview(req.user._id), 'OK');
});

export const formations = asyncHandler(async (req, res) => {
  return ok(res, await learning.trainerFormations(req.user._id), 'OK');
});

export const createFormation = asyncHandler(async (req, res) => {
  return created(
    res,
    await learning.createTraining(req.user, trainingSchema.parse(req.body)),
    'Formation créée'
  );
});

export const updateFormation = asyncHandler(async (req, res) => {
  return ok(
    res,
    await learning.updateTraining(req.user, req.params.id, trainingSchema.partial().parse(req.body)),
    'Formation mise à jour'
  );
});

export const addModule = asyncHandler(async (req, res) => {
  return created(
    res,
    await learning.addModule(req.user, req.params.id, moduleSchema.parse(req.body)),
    'Module ajouté'
  );
});

export const updateModule = asyncHandler(async (req, res) => {
  return ok(
    res,
    await learning.updateModule(
      req.user,
      req.params.id,
      req.params.moduleId,
      moduleSchema.partial().parse(req.body)
    ),
    'Module mis à jour'
  );
});

export const deleteModule = asyncHandler(async (req, res) => {
  return ok(
    res,
    await learning.deleteModule(req.user, req.params.id, req.params.moduleId),
    'Module supprimé'
  );
});

export const addChapter = asyncHandler(async (req, res) => {
  const payload = chapterSchema.parse(parseMultipart(req));
  return created(
    res,
    await learning.addChapter(
      req.user,
      req.params.id,
      req.params.moduleId,
      await withDocument(req, payload)
    ),
    'Chapitre ajouté'
  );
});

export const updateChapter = asyncHandler(async (req, res) => {
  const payload = chapterSchema.partial().parse(parseMultipart(req));
  return ok(
    res,
    await learning.updateChapter(
      req.user,
      req.params.id,
      req.params.moduleId,
      req.params.chapterId,
      await withDocument(req, payload)
    ),
    'Chapitre mis à jour'
  );
});

export const deleteChapter = asyncHandler(async (req, res) => {
  return ok(
    res,
    await learning.deleteChapter(
      req.user,
      req.params.id,
      req.params.moduleId,
      req.params.chapterId
    ),
    'Chapitre supprimé'
  );
});

export const setFinalExam = asyncHandler(async (req, res) => {
  return ok(
    res,
    await learning.updateTraining(req.user, req.params.id, {
      examenFinal: evaluationSchema.parse(req.body),
    }),
    'Examen final enregistré'
  );
});

export const corrections = asyncHandler(async (req, res) => {
  return ok(res, await learning.pendingCorrections(req.user._id), 'OK');
});

export const correct = asyncHandler(async (req, res) => {
  const body = z.object({ points: z.record(z.coerce.number().min(0)) }).parse(req.body);
  return ok(
    res,
    await learning.correctAttempt(
      req.user._id,
      req.params.progressionId,
      req.params.attemptId,
      body.points
    ),
    'Correction enregistrée'
  );
});
