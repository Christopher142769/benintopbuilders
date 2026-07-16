import mongoose from 'mongoose';
import { LABEL_NIVEAUX } from '../config/constants.js';
import { toJSONPlugin } from './plugins/toJSON.js';

export const LABEL_FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'email',
  'tel',
  'url',
  'date',
  'select',
  'multiselect',
  'checkbox',
  'file',
];

const champSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: LABEL_FIELD_TYPES, required: true },
    description: { type: String, trim: true },
    placeholder: { type: String, trim: true },
    required: { type: Boolean, default: false },
    options: [{ type: String, trim: true }],
    accept: { type: String, default: 'image/*,.pdf,.doc,.docx' },
    ordre: { type: Number, default: 0 },
  },
  { _id: true }
);

const labelFormulaireSchema = new mongoose.Schema(
  {
    niveau: { type: String, enum: LABEL_NIVEAUX, required: true, unique: true, index: true },
    titre: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    actif: { type: Boolean, default: true, index: true },
    version: { type: Number, default: 1 },
    champs: {
      type: [champSchema],
      validate: {
        validator(champs) {
          return new Set(champs.map((c) => c.key)).size === champs.length;
        },
        message: 'Les identifiants de champs doivent être uniques',
      },
    },
    formationsRequises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Formation' }],
    creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

labelFormulaireSchema.plugin(toJSONPlugin);

export const LabelFormulaire =
  mongoose.models.LabelFormulaire ||
  mongoose.model('LabelFormulaire', labelFormulaireSchema);
