import mongoose from 'mongoose';
import { REPONSE_STATUS } from '../config/constants.js';
import { toJSONPlugin } from './plugins/toJSON.js';

const reponseAOSchema = new mongoose.Schema(
  {
    aoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppelOffre',
      required: true,
      index: true,
    },
    membreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    montant: { type: Number, required: true, min: 0 },
    delaiJours: { type: Number, required: true, min: 1 },
    memoireTechnique: { type: String, required: true },
    piecesJointes: [String],
    statut: { type: String, enum: REPONSE_STATUS, default: 'recue', index: true },
  },
  { timestamps: true }
);

reponseAOSchema.index({ aoId: 1, membreId: 1 }, { unique: true });
reponseAOSchema.plugin(toJSONPlugin);

export const ReponseAO =
  mongoose.models.ReponseAO || mongoose.model('ReponseAO', reponseAOSchema);
