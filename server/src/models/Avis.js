import mongoose from 'mongoose';
import { AVIS_STATUS } from '../config/constants.js';
import { toJSONPlugin } from './plugins/toJSON.js';

const avisSchema = new mongoose.Schema(
  {
    auteurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cibleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    note: { type: Number, required: true, min: 1, max: 5 },
    commentaire: { type: String, maxlength: 2000 },
    contexte: {
      type: {
        type: String,
        enum: ['ao', 'commande'],
        required: true,
      },
      refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    statut: { type: String, enum: AVIS_STATUS, default: 'en_moderation', index: true },
    signalements: [
      {
        par: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        motif: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

avisSchema.index(
  { auteurId: 1, 'contexte.type': 1, 'contexte.refId': 1 },
  { unique: true }
);

avisSchema.plugin(toJSONPlugin);

async function recalculerNotes(cibleId) {
  const User = mongoose.model('User');
  const Avis = mongoose.model('Avis');
  const stats = await Avis.aggregate([
    { $match: { cibleId, statut: 'publie' } },
    {
      $group: {
        _id: '$cibleId',
        noteMoyenne: { $avg: '$note' },
        nbAvis: { $sum: 1 },
      },
    },
  ]);

  if (stats[0]) {
    await User.findByIdAndUpdate(cibleId, {
      noteMoyenne: Math.round(stats[0].noteMoyenne * 10) / 10,
      nbAvis: stats[0].nbAvis,
    });
  } else {
    await User.findByIdAndUpdate(cibleId, { noteMoyenne: 0, nbAvis: 0 });
  }
}

avisSchema.post('save', async function postSave(doc) {
  try {
    await recalculerNotes(doc.cibleId);
  } catch (err) {
    console.error('Erreur recalcul notes avis', err);
  }
});

avisSchema.post('findOneAndUpdate', async function postUpdate(doc) {
  if (doc?.cibleId) {
    try {
      await recalculerNotes(doc.cibleId);
    } catch (err) {
      console.error('Erreur recalcul notes avis', err);
    }
  }
});

export const Avis = mongoose.models.Avis || mongoose.model('Avis', avisSchema);
