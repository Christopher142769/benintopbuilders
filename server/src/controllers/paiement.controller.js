import { ok, created } from '../utils/apiResponse.js';
import { AppError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as paiementService from '../services/paiement.service.js';
import { User } from '../models/User.js';
import { z } from 'zod';
import { PALIERS } from '../config/constants.js';

const initAdhesionSchema = z.object({
  palier: z.enum(PALIERS),
  moyen: z.enum(['mtn_momo', 'moov', 'celtiis', 'carte', 'virement', 'sandbox']).optional(),
});

export const initAdhesion = asyncHandler(async (req, res) => {
  const body = initAdhesionSchema.parse(req.body);
  const result = await paiementService.initierAdhesionPaiement(
    req.user,
    body.palier,
    body.moyen || 'sandbox'
  );
  return created(
    res,
    {
      paiement: result.paiement,
      checkoutUrl: result.checkoutUrl,
      sandbox: result.sandbox,
    },
    result.sandbox ? 'Paiement sandbox initié' : 'Paiement FSPay initié'
  );
});

export const getByRef = asyncHandler(async (req, res) => {
  const paiement = await paiementService.getPaiementByRef(req.params.ref);
  // L'utilisateur doit être propriétaire sauf admin
  const isOwner = String(paiement.userId) === String(req.user._id);
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
  if (!isOwner && !isAdmin) {
    throw new AppError('Accès refusé', { status: 403, code: 'FORBIDDEN' });
  }
  const user = await User.findById(paiement.userId);
  return ok(res, { paiement, user }, 'OK');
});

export const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-fspay-signature'] || req.headers['x-signature'];
  const raw = req.rawBody || JSON.stringify(req.body);
  if (!paiementService.verifyWebhookSignature(raw, signature)) {
    throw new AppError('Signature webhook invalide', { status: 401, code: 'INVALID_SIGNATURE' });
  }
  const result = await paiementService.traiterWebhook(req.body);
  return ok(
    res,
    { paiement: result.paiement, alreadyProcessed: result.alreadyProcessed },
    result.alreadyProcessed ? 'Déjà traité' : 'Webhook traité'
  );
});

export const relancer = asyncHandler(async (req, res) => {
  const paiement = await paiementService.getPaiementByRef(req.params.ref);
  if (String(paiement.userId) !== String(req.user._id)) {
    throw new AppError('Accès refusé', { status: 403, code: 'FORBIDDEN' });
  }
  if (paiement.statut === 'reussi') {
    return ok(res, { paiement }, 'Déjà payé');
  }
  const result = await paiementService.initierPaiement({
    userId: req.user._id,
    type: paiement.type,
    montant: paiement.montant,
    moyen: paiement.moyen,
    meta: paiement.meta,
  });
  return created(
    res,
    { paiement: result.paiement, checkoutUrl: result.checkoutUrl, sandbox: result.sandbox },
    'Nouveau paiement initié'
  );
});
