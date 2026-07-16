import { ok, created } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as labelService from '../services/label.service.js';
import { saveDocument } from '../services/upload.service.js';
import { z } from 'zod';
import { LABEL_NIVEAUX } from '../config/constants.js';

const createSchema = z.object({
  niveauDemande: z.enum(LABEL_NIVEAUX),
});

export const create = asyncHandler(async (req, res) => {
  const body = createSchema.parse(req.body);
  const pieces = [];
  const fichiers = {};
  for (const file of req.files || []) {
    const saved = await saveDocument(file, {
      folder: 'dossiers',
      filenamePrefix: file.fieldname.replace(/^field_/, ''),
    });
    const key = file.fieldname.replace(/^field_/, '');
    fichiers[key] = saved;
    pieces.push({
      type: ['ifu', 'rccm', 'cnss', 'assurance', 'references'].includes(key) ? key : 'autre',
      url: saved.url,
      nomOriginal: saved.nomOriginal,
    });
  }
  let valeurs = {};
  try {
    valeurs = JSON.parse(req.body.valeurs || '{}');
  } catch {
    valeurs = {};
  }
  const data = await labelService.creerDossier(req.user, {
    niveauDemande: body.niveauDemande,
    pieces,
    valeurs,
    fichiers,
  });
  return created(
    res,
    data,
    data.fraisInclusAbonnement
      ? 'Dossier créé — labellisation incluse dans votre abonnement'
      : data.sandbox
        ? 'Dossier créé — paiement sandbox initié'
        : 'Dossier créé'
  );
});

export const mine = asyncHandler(async (req, res) => {
  const dossier = await labelService.getMonDossier(req.user._id);
  return ok(res, { dossier }, dossier ? 'OK' : 'Aucun dossier');
});

export const form = asyncHandler(async (req, res) => {
  const niveau = z.enum(LABEL_NIVEAUX).parse(req.params.niveau);
  const formulaire = await labelService.getFormulaire(niveau);
  return ok(res, { formulaire }, formulaire ? 'OK' : 'Formulaire non configuré');
});
