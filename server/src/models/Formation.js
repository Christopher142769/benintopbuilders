import mongoose from 'mongoose';
import { FORMATION_MODALITES } from '../config/constants.js';
import { toJSONPlugin } from './plugins/toJSON.js';

const questionSchema = new mongoose.Schema(
  {
    intitule: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['choix_multiple', 'choix_unique', 'texte_libre', 'fichier'],
      required: true,
    },
    options: [{ type: String, trim: true }],
    reponsesCorrectes: [{ type: String, trim: true }],
    motsCles: [{ type: String, trim: true, lowercase: true }],
    points: { type: Number, required: true, min: 0.5, default: 1 },
    explication: { type: String, trim: true },
  },
  { _id: true }
);

const evaluationSchema = new mongoose.Schema(
  {
    titre: { type: String, trim: true, default: 'Évaluation' },
    instructions: { type: String, trim: true },
    notePassage: { type: Number, min: 0, max: 100, default: 70 },
    tentativesMax: { type: Number, min: 1, max: 20, default: 3 },
    questions: [questionSchema],
  },
  { _id: true }
);

const chapitreSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    ordre: { type: Number, required: true, min: 0 },
    contenuType: {
      type: String,
      enum: ['texte', 'document', 'youtube', 'zoom'],
      required: true,
      default: 'texte',
    },
    contenu: { type: String },
    ressourceUrl: { type: String },
    nomFichier: { type: String },
    dureeMinutes: { type: Number, min: 0, default: 0 },
    evaluation: { type: evaluationSchema, default: undefined },
    actif: { type: Boolean, default: true },
  },
  { _id: true }
);

const moduleSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    ordre: { type: Number, required: true, min: 0 },
    chapitres: [chapitreSchema],
    actif: { type: Boolean, default: true },
  },
  { _id: true }
);

const formationSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    modalite: { type: String, enum: FORMATION_MODALITES, required: true, default: 'en_ligne' },
    dateDebut: { type: Date, required: true, default: Date.now, index: true },
    dateFin: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    dureeHeures: { type: Number, required: true, default: 1 },
    lieu: String,
    placesTotal: { type: Number, required: true, min: 1, default: 10000 },
    placesRestantes: { type: Number, required: true, min: 0, default: 10000 },
    tarifMembre: { type: Number, required: true, min: 0, default: 0 },
    tarifNonMembre: { type: Number, required: true, min: 0, default: 0 },
    requiseLabelOr: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
    imageUrl: String,
    formateurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    niveauxLabels: [{ type: String, enum: ['bronze', 'argent', 'or'] }],
    statutPublication: {
      type: String,
      enum: ['brouillon', 'publie', 'archive'],
      default: 'brouillon',
      index: true,
    },
    modules: [moduleSchema],
    examenFinal: { type: evaluationSchema, default: undefined },
  },
  { timestamps: true }
);

formationSchema.index({ titre: 'text', description: 'text' });
formationSchema.plugin(toJSONPlugin);

export const Formation =
  mongoose.models.Formation || mongoose.model('Formation', formationSchema);
