import mongoose from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.js';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    contexte: {
      type: {
        type: String,
        enum: ['annuaire', 'fiche', 'ao', 'commande', 'general'],
        default: 'general',
      },
      refId: { type: mongoose.Schema.Types.ObjectId },
      label: String,
    },
    dernierMessageAt: { type: Date, default: Date.now, index: true },
    dernierMessageApercu: String,
    nonLus: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index(
  { participants: 1, 'contexte.type': 1, 'contexte.refId': 1 },
  { unique: true, partialFilterExpression: { 'contexte.refId': { $type: 'objectId' } } }
);
conversationSchema.plugin(toJSONPlugin);

export const Conversation =
  mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
