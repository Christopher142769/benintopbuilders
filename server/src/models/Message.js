import mongoose from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.js';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    auteurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    corps: { type: String, required: true, maxlength: 5000 },
    corpsMasque: { type: String },
    luPar: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.plugin(toJSONPlugin);

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
