import { ok, created } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/formations.service.js';
import { z } from 'zod';
import { authenticate, requireRole } from '../middlewares/auth.js';

export const catalogue = asyncHandler(async (_req, res) => {
  return ok(res, await svc.catalogueFormations(), 'OK');
});

export const inscrire = asyncHandler(async (req, res) => {
  const body = z
    .object({ nbParticipants: z.number().int().min(1).default(1) })
    .parse({ nbParticipants: Number(req.body.nbParticipants || 1) });
  const data = await svc.inscrireFormation(req.user, req.params.id, body.nbParticipants);
  return created(res, data, data.needsPayment ? 'Paiement requis' : 'Inscription confirmée');
});

export const mesInscriptions = asyncHandler(async (req, res) => {
  return ok(res, await svc.mesInscriptions(req.user._id), 'OK');
});

export const emarger = asyncHandler(async (req, res) => {
  const present = req.body.present !== false;
  const data = await svc.emargement(req.params.inscriptionId, present);
  return ok(res, data, 'Émargement enregistré');
});

export const avisCreate = asyncHandler(async (req, res) => {
  const body = z
    .object({
      cibleId: z.string(),
      note: z.number().int().min(1).max(5),
      commentaire: z.string().max(2000).optional(),
      contexte: z.object({
        type: z.enum(['ao', 'commande']),
        refId: z.string(),
      }),
    })
    .parse(req.body);
  const avis = await svc.creerAvis(req.user, body);
  return created(res, avis, 'Avis soumis à modération');
});

export const avisSignaler = asyncHandler(async (req, res) => {
  const motif = z.string().min(3).parse(req.body.motif);
  const avis = await svc.signalerAvis(req.params.id, req.user._id, motif);
  return ok(res, avis, 'Signalé');
});

export { authenticate, requireRole };
