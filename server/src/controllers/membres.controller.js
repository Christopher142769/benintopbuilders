import { ok } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as membresService from '../services/membres.service.js';
import { saveResizedImage } from '../services/upload.service.js';
import { z } from 'zod';
import { DEPARTEMENTS, METIERS, LABEL_NIVEAUX } from '../config/constants.js';

export const list = asyncHandler(async (req, res) => {
  const result = await membresService.listMembres(req.query);
  return ok(res, result.data, 'OK', 200, result.pagination);
});

export const near = asyncHandler(async (req, res) => {
  const data = await membresService.nearMembres(req.query);
  return ok(res, data, 'OK');
});

export const markers = asyncHandler(async (req, res) => {
  const data = await membresService.mapMarkers(req.query);
  return ok(res, data, 'OK');
});

export const bySlug = asyncHandler(async (req, res) => {
  const data = await membresService.getBySlug(req.params.slug);
  return ok(res, data, 'OK');
});

const profilSchema = z.object({
  entreprise: z.string().max(160).optional(),
  presentation: z.string().max(5000).optional(),
  metiers: z.array(z.enum(METIERS)).optional(),
  departement: z.enum(DEPARTEMENTS).optional(),
  ville: z.string().max(100).optional(),
  zonesIntervention: z.array(z.string()).optional(),
  disponible: z.boolean().optional(),
  fichePubliee: z.boolean().optional(),
  telephone: z.string().max(20).optional(),
  lng: z.number().optional(),
  lat: z.number().optional(),
  references: z
    .array(
      z.object({
        titre: z.string(),
        description: z.string().optional(),
        lieu: z.string().optional(),
        annee: z.number().optional(),
        photos: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

export const updateProfil = asyncHandler(async (req, res) => {
  const body = profilSchema.parse(req.body);
  const user = await membresService.updateMonProfil(req.user._id, body);
  return ok(res, { user }, 'Profil mis à jour');
});

export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ok(res, null, 'Fichier manquant', 400);
  }
  const url = await saveResizedImage(req.file.buffer, {
    folder: 'logos',
    maxSize: 512,
    filenamePrefix: 'logo',
  });
  const user = await membresService.setLogo(req.user._id, url);
  return ok(res, { user, url }, 'Logo mis à jour');
});

export const uploadReferencePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ok(res, null, 'Fichier manquant', 400);
  }
  const url = await saveResizedImage(req.file.buffer, {
    folder: 'references',
    maxSize: 1200,
    filenamePrefix: 'ref',
  });
  const titre = req.body.titre || 'Référence chantier';
  const user = await membresService.addReference(req.user._id, {
    titre,
    description: req.body.description,
    lieu: req.body.lieu,
    annee: req.body.annee ? Number(req.body.annee) : undefined,
    photos: [url],
  });
  return ok(res, { user, url }, 'Référence ajoutée');
});

export const mePublicCheck = asyncHandler(async (req, res) => {
  // sanity for tests
  return ok(res, { labels: LABEL_NIVEAUX }, 'OK');
});
