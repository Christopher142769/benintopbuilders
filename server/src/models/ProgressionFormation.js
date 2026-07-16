import mongoose from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.js';

const reponseSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    valeur: mongoose.Schema.Types.Mixed,
    fichierUrl: String,
    nomFichier: String,
    pointsObtenus: { type: Number, default: 0 },
    pointsMax: { type: Number, default: 0 },
    correctionManuelle: { type: Boolean, default: false },
  },
  { _id: false }
);

const tentativeSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['chapitre', 'final'], required: true },
    chapitreId: { type: mongoose.Schema.Types.ObjectId },
    reponses: [reponseSchema],
    score: { type: Number, min: 0, max: 100, default: 0 },
    reussi: { type: Boolean, default: false },
    statut: {
      type: String,
      enum: ['corrigee', 'a_corriger', 'validee'],
      default: 'corrigee',
    },
    soumisAt: { type: Date, default: Date.now },
    corrigePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    corrigeAt: Date,
  },
  { _id: true }
);

const progressionFormationSchema = new mongoose.Schema(
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
    chapitresTermines: [{ type: mongoose.Schema.Types.ObjectId }],
    chapitreActuelId: { type: mongoose.Schema.Types.ObjectId },
    tentatives: [tentativeSchema],
    pourcentage: { type: Number, min: 0, max: 100, default: 0 },
    statut: {
      type: String,
      enum: ['en_cours', 'examen', 'a_corriger', 'terminee', 'echouee'],
      default: 'en_cours',
      index: true,
    },
    scoreFinal: { type: Number, min: 0, max: 100 },
    termineAt: Date,
    certificatUrl: String,
  },
  { timestamps: true }
);

progressionFormationSchema.index({ formationId: 1, userId: 1 }, { unique: true });
progressionFormationSchema.plugin(toJSONPlugin);

export const ProgressionFormation =
  mongoose.models.ProgressionFormation ||
  mongoose.model('ProgressionFormation', progressionFormationSchema);
