import { ok } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as admin from '../services/admin.service.js';
import { z } from 'zod';
import { DOSSIER_STATUS } from '../config/constants.js';

export const dossiers = asyncHandler(async (req, res) => {
  return ok(res, await admin.listDossiers(req.query.statut), 'OK');
});

export const dossierTransition = asyncHandler(async (req, res) => {
  const body = z
    .object({
      to: z.enum(DOSSIER_STATUS),
      motif: z.string().optional(),
      piecesManquantes: z.array(z.string()).optional(),
      visiteAt: z.string().optional(),
    })
    .parse(req.body);
  const dossier = await admin.transitionDossierAdmin(req.user, req.params.id, body);
  return ok(res, dossier, 'Transition effectuée');
});

export const membres = asyncHandler(async (req, res) => {
  return ok(res, await admin.listMembres(req.query), 'OK');
});

export const suspendre = asyncHandler(async (req, res) => {
  const motif = z.string().min(3).parse(req.body.motif);
  return ok(res, await admin.suspendreMembre(req.user, req.params.id, motif), 'Suspendu');
});

export const reactiver = asyncHandler(async (req, res) => {
  return ok(res, await admin.reactiverMembre(req.user, req.params.id), 'Réactivé');
});

export const avisModeration = asyncHandler(async (_req, res) => {
  return ok(res, await admin.moderationAvis(), 'OK');
});

export const avisDecision = asyncHandler(async (req, res) => {
  const publier = z.boolean().parse(req.body.publier);
  return ok(res, await admin.publierAvis(req.user, req.params.id, publier), 'OK');
});

export const prixAnormaux = asyncHandler(async (_req, res) => {
  return ok(res, await admin.prixAnormaux(), 'OK');
});

export const aoDoublons = asyncHandler(async (_req, res) => {
  return ok(res, await admin.aoDoublons(), 'OK');
});

export const stats = asyncHandler(async (_req, res) => {
  return ok(res, await admin.statsOverview(), 'OK');
});

export const audit = asyncHandler(async (req, res) => {
  return ok(res, await admin.listAudit(req.query), 'OK');
});
