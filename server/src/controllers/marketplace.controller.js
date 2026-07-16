import { ok, created } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as mkt from '../services/marketplace.service.js';
import { z } from 'zod';
import { CATEGORIES_MATERIAUX } from '../config/constants.js';
import { saveResizedImage } from '../services/upload.service.js';

const produitSchema = z.object({
  nom: z.string().min(2).max(160),
  description: z.string().max(5000).optional(),
  categorie: z.enum(CATEGORIES_MATERIAUX),
  prixUnitaire: z.number().min(0),
  unite: z.string().optional(),
  stock: z.number().int().min(0),
  photos: z.array(z.string()).optional(),
  actif: z.boolean().optional(),
  sku: z.string().optional(),
});

export const catalogue = asyncHandler(async (req, res) => {
  const result = await mkt.catalogue(req.query);
  return ok(res, result.data, 'OK', 200, result.pagination);
});

export const mesProduits = asyncHandler(async (req, res) => {
  const data = await mkt.mesProduits(req.user._id);
  return ok(res, data, 'OK');
});

export const createProduit = asyncHandler(async (req, res) => {
  const uploadedPhoto = req.file
    ? await saveResizedImage(req.file.buffer, {
        folder: 'produits',
        maxSize: 1400,
        filenamePrefix: 'produit',
        mimetype: req.file.mimetype,
      })
    : null;
  const body = produitSchema.parse({
    ...req.body,
    prixUnitaire: Number(req.body.prixUnitaire),
    stock: Number(req.body.stock),
    photos: uploadedPhoto ? [uploadedPhoto] : [],
  });
  const p = await mkt.upsertProduit(req.user, body);
  return created(res, p, 'Produit créé');
});

export const updateProduit = asyncHandler(async (req, res) => {
  const uploadedPhoto = req.file
    ? await saveResizedImage(req.file.buffer, {
        folder: 'produits',
        maxSize: 1400,
        filenamePrefix: 'produit',
        mimetype: req.file.mimetype,
      })
    : null;
  const body = produitSchema.partial().parse({
    ...req.body,
    ...(req.body.prixUnitaire != null ? { prixUnitaire: Number(req.body.prixUnitaire) } : {}),
    ...(req.body.stock != null ? { stock: Number(req.body.stock) } : {}),
    ...(uploadedPhoto ? { photos: [uploadedPhoto] } : {}),
  });
  const p = await mkt.upsertProduit(req.user, body, req.params.id);
  return ok(res, p, 'Produit mis à jour');
});

export const deleteProduit = asyncHandler(async (req, res) => {
  await mkt.supprimerProduit(req.user._id, req.params.id);
  return ok(res, null, 'Produit supprimé');
});

const commandeSchema = z.object({
  lignes: z
    .array(
      z.object({
        produitId: z.string(),
        quantite: z.number().int().min(1),
      })
    )
    .min(1),
  adresseLivraison: z.object({
    nom: z.string().min(1),
    telephone: z.string().min(8),
    departement: z.string().optional(),
    ville: z.string().min(1),
    quartier: z.string().optional(),
    details: z.string().optional(),
  }),
  message: z.string().max(2000).optional(),
});

export const createCommande = asyncHandler(async (req, res) => {
  const body = commandeSchema.parse(req.body);
  const data = await mkt.creerCommande(req.user, body);
  return created(res, data, 'Commande créée');
});

export const mesCommandes = asyncHandler(async (req, res) => {
  return ok(res, await mkt.mesCommandes(req.user._id), 'OK');
});

export const mesVentes = asyncHandler(async (req, res) => {
  return ok(res, await mkt.mesVentes(req.user._id), 'OK');
});

export const setStatut = asyncHandler(async (req, res) => {
  const to = z
    .enum(['prise_de_contact', 'finalisee', 'annulee'])
    .parse(req.body.statut);
  const c = await mkt.transitionCommande(req.params.id, req.user, to);
  return ok(res, c, 'Statut mis à jour');
});
