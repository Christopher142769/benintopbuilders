import mongoose from 'mongoose';
import { AO_STATUS, DEPARTEMENTS, METIERS } from '../config/constants.js';
import { toJSONPlugin } from './plugins/toJSON.js';

const appelOffreSchema = new mongoose.Schema(
  {
    auteurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    categorie: { type: String, enum: METIERS, required: true, index: true },
    departement: { type: String, enum: DEPARTEMENTS, required: true, index: true },
    ville: { type: String, trim: true },
    budgetMin: Number,
    budgetMax: Number,
    surDevis: { type: Boolean, default: false },
    dateCloture: { type: Date, required: true, index: true },
    piecesJointes: [String],
    statut: { type: String, enum: AO_STATUS, default: 'ouvert', index: true },
    visiblePremiumAvant: { type: Date }, // publishedAt + 0; standard sees at +24h from created
    publishedAt: { type: Date, default: Date.now },
    attribueA: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reponseRetenueId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReponseAO' },
    nbReponses: { type: Number, default: 0 },
    localisation: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
  },
  { timestamps: true }
);

appelOffreSchema.index({ titre: 'text', description: 'text' });
appelOffreSchema.index({ statut: 1, dateCloture: 1 });
appelOffreSchema.index({ localisation: '2dsphere' });
appelOffreSchema.plugin(toJSONPlugin);

export const AppelOffre =
  mongoose.models.AppelOffre || mongoose.model('AppelOffre', appelOffreSchema);
