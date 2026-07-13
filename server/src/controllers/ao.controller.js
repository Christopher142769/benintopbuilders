import { ok, created } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as aoService from '../services/ao.service.js';
import { z } from 'zod';
import { DEPARTEMENTS, METIERS } from '../config/constants.js';
import { optionalAuth, authenticate, requireStatut } from '../middlewares/auth.js';

const createSchema = z.object({
  titre: z.string().min(5).max(200),
  description: z.string().min(20).max(10000),
  categorie: z.enum(METIERS),
  departement: z.enum(DEPARTEMENTS),
  ville: z.string().max(100).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  surDevis: z.boolean().optional(),
  dateCloture: z.string().or(z.date()),
});

const reponseSchema = z.object({
  montant: z.number().min(0),
  delaiJours: z.number().int().min(1),
  memoireTechnique: z.string().min(20).max(10000),
});

export const list = [
  optionalAuth,
  asyncHandler(async (req, res) => {
    const data = await aoService.listAO(req.user, req.query);
    return ok(res, data, 'OK');
  }),
];

export const create = asyncHandler(async (req, res) => {
  const body = createSchema.parse({
    ...req.body,
    budgetMin: req.body.budgetMin != null ? Number(req.body.budgetMin) : undefined,
    budgetMax: req.body.budgetMax != null ? Number(req.body.budgetMax) : undefined,
    surDevis: req.body.surDevis === true || req.body.surDevis === 'true',
  });
  body.dateCloture = new Date(body.dateCloture);
  const ao = await aoService.createAO(req.user, body);
  return created(res, ao, 'AO publié');
});

export const getOne = asyncHandler(async (req, res) => {
  const ao = await aoService.getAO(req.params.id);
  return ok(res, ao, 'OK');
});

export const update = asyncHandler(async (req, res) => {
  const ao = await aoService.updateAO(req.params.id, req.user._id, req.body);
  return ok(res, ao, 'AO mis à jour');
});

export const repondre = asyncHandler(async (req, res) => {
  const body = reponseSchema.parse({
    ...req.body,
    montant: Number(req.body.montant),
    delaiJours: Number(req.body.delaiJours),
  });
  const reponse = await aoService.deposerReponse(req.user, req.params.id, body);
  return created(res, reponse, 'Réponse déposée');
});

export const reponses = asyncHandler(async (req, res) => {
  const data = await aoService.listReponsesForAO(req.params.id, req.user._id);
  return ok(res, data, 'OK');
});

export const mesReponses = asyncHandler(async (req, res) => {
  const data = await aoService.mesReponses(req.user._id);
  return ok(res, data, 'OK');
});

export const mesAO = asyncHandler(async (req, res) => {
  const data = await aoService.mesAO(req.user._id);
  return ok(res, data, 'OK');
});

export const setReponseStatut = asyncHandler(async (req, res) => {
  const statut = z.enum(['en_etude', 'retenue', 'non_retenue']).parse(req.body.statut);
  const reponse = await aoService.updateReponseStatut(req.user._id, req.params.reponseId, statut);
  return ok(res, reponse, 'Statut mis à jour');
});
