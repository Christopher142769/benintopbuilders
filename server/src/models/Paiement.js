import mongoose from 'mongoose';
import { PAIEMENT_STATUS, PAIEMENT_TYPES } from '../config/constants.js';
import { toJSONPlugin } from './plugins/toJSON.js';

const paiementSchema = new mongoose.Schema(
  {
    refInterne: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: PAIEMENT_TYPES, required: true, index: true },
    montant: { type: Number, required: true, min: 0 },
    devise: { type: String, default: 'XOF' },
    statut: { type: String, enum: PAIEMENT_STATUS, default: 'initie', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Références contextuelles
    meta: {
      palier: String,
      niveauLabel: String,
      commandeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande' },
      formationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Formation' },
      dossierLabelId: { type: mongoose.Schema.Types.ObjectId, ref: 'DossierLabel' },
      inscriptionFormationId: { type: mongoose.Schema.Types.ObjectId, ref: 'InscriptionFormation' },
    },
    moyen: {
      type: String,
      enum: ['mtn_momo', 'moov', 'celtiis', 'carte', 'virement', 'sandbox'],
      default: 'sandbox',
    },
    fspayRef: String,
    fspayPayload: mongoose.Schema.Types.Mixed,
    webhookEvents: [
      {
        at: { type: Date, default: Date.now },
        eventId: String,
        payload: mongoose.Schema.Types.Mixed,
      },
    ],
    webhookProcessed: { type: Boolean, default: false },
    lastWebhookEventId: { type: String, index: true, sparse: true },
    payeAt: Date,
    echecMotif: String,
  },
  { timestamps: true }
);

paiementSchema.index({ type: 1, statut: 1, createdAt: -1 });
paiementSchema.plugin(toJSONPlugin);

export const Paiement =
  mongoose.models.Paiement || mongoose.model('Paiement', paiementSchema);
