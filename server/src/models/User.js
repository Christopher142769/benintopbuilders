import mongoose from 'mongoose';
import {
  ROLES,
  PROFIL_TYPES,
  PALIERS,
  LABEL_NIVEAUX,
  USER_STATUS,
  DEPARTEMENTS,
  METIERS,
} from '../config/constants.js';
import { toJSONPlugin } from './plugins/toJSON.js';

const referenceSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    lieu: { type: String, trim: true },
    annee: Number,
    photos: [{ type: String }],
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true },
    organisme: String,
    dateObtention: Date,
    formationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Formation' },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String },
    role: { type: String, enum: ROLES, default: 'visiteur', index: true },
    statut: { type: String, enum: USER_STATUS, default: 'pending_otp', index: true },
    profilType: { type: String, enum: PROFIL_TYPES },
    palier: { type: String, enum: PALIERS, default: 'decouverte', index: true },
    renewalAuto: { type: Boolean, default: false },
    adhesionExpireAt: { type: Date, index: true },

    // Identité
    prenom: { type: String, trim: true },
    nom: { type: String, trim: true },
    telephone: { type: String, trim: true },
    entreprise: { type: String, trim: true },
    ifu: { type: String, trim: true },
    rccm: { type: String, trim: true },
    rccmDocumentUrl: { type: String },
    rccmDocumentNom: { type: String, trim: true },
    departement: { type: String, enum: DEPARTEMENTS },
    ville: { type: String, trim: true },
    zonesIntervention: [{ type: String, trim: true }],
    presentation: { type: String, maxlength: 5000 },
    metiers: [{ type: String, enum: METIERS }],
    logoUrl: String,
    disponible: { type: Boolean, default: true, index: true },

    // GeoJSON Point [lng, lat] — omis tant que non renseigné (évite index 2dsphere cassé)
    localisation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },

    slug: { type: String, unique: true, sparse: true, index: true },
    fichePubliee: { type: Boolean, default: false, index: true },

    label: {
      niveau: { type: String, enum: [...LABEL_NIVEAUX, null], default: null },
      obtenuAt: Date,
      expireAt: Date,
    },

    noteMoyenne: { type: Number, default: 0, min: 0, max: 5 },
    nbAvis: { type: Number, default: 0, min: 0 },

    references: [referenceSchema],
    certifications: [certificationSchema],

    charteAccepteeAt: Date,
    emailVerifieAt: Date,
    refreshTokenHash: String,
    passwordResetTokenHash: String,
    passwordResetExpireAt: Date,

    reponsesAoCeMois: { type: Number, default: 0 },
    reponsesAoMoisCle: String, // YYYY-MM

    suspenduMotif: String,
    suspenduAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ localisation: '2dsphere' });
userSchema.index({
  entreprise: 'text',
  presentation: 'text',
  ville: 'text',
  prenom: 'text',
  nom: 'text',
});
userSchema.index({ fichePubliee: 1, 'label.niveau': 1, palier: 1, noteMoyenne: -1 });
userSchema.index({ metiers: 1, departement: 1, disponible: 1 });

userSchema.plugin(toJSONPlugin);

userSchema.virtual('nomComplet').get(function nomComplet() {
  return [this.prenom, this.nom].filter(Boolean).join(' ');
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
