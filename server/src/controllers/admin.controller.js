import { ok } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as admin from '../services/admin.service.js';
import { z } from 'zod';
import { DOSSIER_STATUS } from '../config/constants.js';
import { LABEL_NIVEAUX } from '../config/constants.js';
import { LABEL_FIELD_TYPES } from '../models/LabelFormulaire.js';

const fieldSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_]+$/, 'Identifiant : lettres minuscules, chiffres et _ uniquement'),
  label: z.string().min(1).max(120),
  type: z.enum(LABEL_FIELD_TYPES),
  description: z.string().max(500).optional().default(''),
  placeholder: z.string().max(200).optional().default(''),
  required: z.boolean().optional().default(false),
  options: z.array(z.string().min(1).max(120)).optional().default([]),
  accept: z.string().max(200).optional().default('image/*,.pdf,.doc,.docx'),
  ordre: z.number().int().optional().default(0),
});

const labelFormSchema = z.object({
  niveau: z.enum(LABEL_NIVEAUX),
  titre: z.string().min(3).max(150),
  description: z.string().max(1000).optional().default(''),
  actif: z.boolean().optional().default(true),
  champs: z.array(fieldSchema).min(1),
  formationsRequises: z.array(z.string()).optional().default([]),
});

const formateurSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  prenom: z.string().min(2).max(80),
  nom: z.string().min(2).max(80),
  telephone: z.string().max(30).optional(),
  niveauxLabels: z.array(z.enum(LABEL_NIVEAUX)).min(1),
  specialite: z.string().min(2).max(160),
  bio: z.string().max(2000).optional(),
  actif: z.boolean().optional(),
});

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

export const labelFormulaires = asyncHandler(async (_req, res) => {
  return ok(res, await admin.listLabelFormulaires(), 'OK');
});

export const createLabelFormulaire = asyncHandler(async (req, res) => {
  const body = labelFormSchema.parse(req.body);
  return ok(res, await admin.createLabelFormulaire(req.user, body), 'Formulaire créé');
});

export const updateLabelFormulaire = asyncHandler(async (req, res) => {
  const body = labelFormSchema.partial().parse(req.body);
  return ok(
    res,
    await admin.updateLabelFormulaire(req.user, req.params.id, body),
    'Formulaire modifié'
  );
});

export const deleteLabelFormulaire = asyncHandler(async (req, res) => {
  return ok(
    res,
    await admin.deleteLabelFormulaire(req.user, req.params.id),
    'Formulaire supprimé'
  );
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

export const formateurs = asyncHandler(async (_req, res) => {
  return ok(res, await admin.listFormateurs(), 'OK');
});

export const createFormateur = asyncHandler(async (req, res) => {
  return ok(res, await admin.createFormateur(req.user, formateurSchema.parse(req.body)), 'Formateur créé');
});

export const updateFormateur = asyncHandler(async (req, res) => {
  return ok(
    res,
    await admin.updateFormateur(req.user, req.params.id, formateurSchema.omit({ email: true, password: true }).partial().parse(req.body)),
    'Formateur modifié'
  );
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
