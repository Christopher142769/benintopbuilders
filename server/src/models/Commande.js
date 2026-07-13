import mongoose from 'mongoose';
import { COMMANDE_STATUS } from '../config/constants.js';
import { toJSONPlugin } from './plugins/toJSON.js';

const ligneSchema = new mongoose.Schema(
  {
    produitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produit', required: true },
    vendeurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nom: String,
    prixUnitaire: { type: Number, required: true },
    quantite: { type: Number, required: true, min: 1 },
    sousTotal: { type: Number, required: true },
  },
  { _id: true }
);

const commandeSchema = new mongoose.Schema(
  {
    acheteurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lignes: { type: [ligneSchema], validate: [(v) => v.length > 0, 'Panier vide'] },
    adresseLivraison: {
      nom: String,
      telephone: String,
      departement: String,
      ville: String,
      quartier: String,
      details: String,
    },
    sousTotal: { type: Number, required: true },
    fraisService: { type: Number, required: true }, // 3 %
    total: { type: Number, required: true },
    statut: { type: String, enum: COMMANDE_STATUS, default: 'en_attente_paiement', index: true },
    paiementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paiement' },
    stockReserveAt: Date,
    livreeAt: Date,
  },
  { timestamps: true }
);

commandeSchema.index({ acheteurId: 1, createdAt: -1 });
commandeSchema.index({ 'lignes.vendeurId': 1, statut: 1 });
commandeSchema.plugin(toJSONPlugin);

export const Commande =
  mongoose.models.Commande || mongoose.model('Commande', commandeSchema);
