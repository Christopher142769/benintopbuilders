import mongoose from 'mongoose';
import { CATEGORIES_MATERIAUX } from '../config/constants.js';
import { toJSONPlugin } from './plugins/toJSON.js';

const produitSchema = new mongoose.Schema(
  {
    vendeurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    nom: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    categorie: { type: String, enum: CATEGORIES_MATERIAUX, required: true, index: true },
    prixUnitaire: { type: Number, required: true, min: 0 },
    unite: { type: String, default: 'unité' },
    stock: { type: Number, required: true, min: 0, default: 0 },
    photos: [String],
    actif: { type: Boolean, default: true, index: true },
    sku: { type: String, trim: true },
  },
  { timestamps: true }
);

produitSchema.index({ nom: 'text', description: 'text' });
produitSchema.index({ categorie: 1, actif: 1, prixUnitaire: 1 });
produitSchema.plugin(toJSONPlugin);

export const Produit = mongoose.models.Produit || mongoose.model('Produit', produitSchema);
