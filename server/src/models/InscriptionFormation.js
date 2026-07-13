import mongoose from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.js';

const inscriptionFormationSchema = new mongoose.Schema(
  {
    formationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Formation',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    nbParticipants: { type: Number, default: 1, min: 1 },
    montant: { type: Number, required: true },
    statut: {
      type: String,
      enum: ['en_attente_paiement', 'confirmee', 'presente', 'absente', 'annulee'],
      default: 'en_attente_paiement',
      index: true,
    },
    paiementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paiement' },
    attestationUrl: String,
    presenceValideeAt: Date,
  },
  { timestamps: true }
);

inscriptionFormationSchema.index({ formationId: 1, userId: 1 }, { unique: true });
inscriptionFormationSchema.plugin(toJSONPlugin);

export const InscriptionFormation =
  mongoose.models.InscriptionFormation ||
  mongoose.model('InscriptionFormation', inscriptionFormationSchema);
