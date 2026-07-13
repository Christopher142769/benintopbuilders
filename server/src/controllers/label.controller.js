import { ok, created } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as labelService from '../services/label.service.js';
import { saveResizedImage } from '../services/upload.service.js';
import { z } from 'zod';
import { LABEL_NIVEAUX } from '../config/constants.js';

const createSchema = z.object({
  niveauDemande: z.enum(LABEL_NIVEAUX),
});

export const create = asyncHandler(async (req, res) => {
  const body = createSchema.parse(req.body);
  const pieces = [];
  const files = req.files || {};
  for (const [type, arr] of Object.entries(files)) {
    const file = arr[0];
    if (!file) continue;
    const url = await saveResizedImage(file.buffer, {
      folder: 'dossiers',
      maxSize: 1600,
      filenamePrefix: type,
      mimetype: file.mimetype,
    });
    pieces.push({ type, url, nomOriginal: file.originalname });
  }
  const data = await labelService.creerDossier(req.user, {
    niveauDemande: body.niveauDemande,
    pieces,
  });
  return created(
    res,
    data,
    data.sandbox ? 'Dossier créé — paiement sandbox initié' : 'Dossier créé'
  );
});

export const mine = asyncHandler(async (req, res) => {
  const dossier = await labelService.getMonDossier(req.user._id);
  return ok(res, { dossier }, dossier ? 'OK' : 'Aucun dossier');
});
