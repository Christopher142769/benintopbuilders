import { ok } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as adhesion from '../services/adhesion.service.js';
import * as authService from '../services/auth.service.js';
import { z } from 'zod';
import { PALIERS } from '../config/constants.js';

export const historique = asyncHandler(async (req, res) => {
  return ok(res, await adhesion.historiquePaiements(req.user._id), 'OK');
});

export const renewal = asyncHandler(async (req, res) => {
  const enabled = z.boolean().parse(req.body.enabled);
  const user = await adhesion.setRenewalAuto(req.user._id, enabled);
  return ok(res, { user }, 'OK');
});

export const changerPalier = asyncHandler(async (req, res) => {
  const palier = z.enum(PALIERS).parse(req.body.palier);
  const data = await authService.selectPalier(req.user._id, palier);
  return ok(res, data, data.needsPayment ? 'Paiement requis' : 'Palier mis à jour');
});
