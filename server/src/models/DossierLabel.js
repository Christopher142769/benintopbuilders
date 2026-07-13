import mongoose from 'mongoose';
import { DOSSIER_STATUS, LABEL_NIVEAUX } from '../config/constants.js';
import { toJSONPlugin } from './plugins/toJSON.js';

const pieceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['ifu', 'rccm', 'cnss', 'assurance', 'references', 'autre'],
      required: true,
    },
    url: { type: String, required: true },
    nomOriginal: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const dossierLabelSchema = new mongoose.Schema(
  {
    membreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    niveauDemande: { type: String, enum: LABEL_NIVEAUX, required: true },
    statut: { type: String, enum: DOSSIER_STATUS, default: 'soumis', index: true },
    pieces: [pieceSchema],
    piecesManquantes: [String],
    visiteAt: Date,
    motifRejet: String,
    paiementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paiement' },
    examinePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    valideAt: Date,
    historique: [
      {
        statut: String,
        note: String,
        par: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

dossierLabelSchema.index({ membreId: 1, createdAt: -1 });
dossierLabelSchema.plugin(toJSONPlugin);

export const DossierLabel =
  mongoose.models.DossierLabel || mongoose.model('DossierLabel', dossierLabelSchema);
