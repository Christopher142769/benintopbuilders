import mongoose from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.js';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: { type: String, required: true, index: true },
    titre: { type: String, required: true },
    corps: { type: String, required: true },
    lien: String,
    lu: { type: Boolean, default: false, index: true },
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, lu: 1, createdAt: -1 });
notificationSchema.plugin(toJSONPlugin);

export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
