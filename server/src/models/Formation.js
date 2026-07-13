import mongoose from 'mongoose';
import { FORMATION_MODALITES } from '../config/constants.js';
import { toJSONPlugin } from './plugins/toJSON.js';

const formationSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    modalite: { type: String, enum: FORMATION_MODALITES, required: true },
    dateDebut: { type: Date, required: true, index: true },
    dateFin: { type: Date, required: true },
    dureeHeures: { type: Number, required: true },
    lieu: String,
    placesTotal: { type: Number, required: true, min: 1 },
    placesRestantes: { type: Number, required: true, min: 0 },
    tarifMembre: { type: Number, required: true, min: 0 },
    tarifNonMembre: { type: Number, required: true, min: 0 },
    requiseLabelOr: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
    imageUrl: String,
  },
  { timestamps: true }
);

formationSchema.index({ titre: 'text', description: 'text' });
formationSchema.plugin(toJSONPlugin);

export const Formation =
  mongoose.models.Formation || mongoose.model('Formation', formationSchema);
