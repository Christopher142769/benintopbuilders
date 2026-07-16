import mongoose from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.js';

const activityEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    day: { type: String, required: true, index: true }, // YYYY-MM-DD UTC
    hour: { type: Number, required: true, min: 0, max: 23 },
    requests: { type: Number, default: 1, min: 1 },
    lastPath: { type: String, maxlength: 300 },
    lastSeenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

activityEventSchema.index({ userId: 1, day: 1, hour: 1 }, { unique: true });
activityEventSchema.index({ day: 1, userId: 1 });
activityEventSchema.plugin(toJSONPlugin);

export const ActivityEvent =
  mongoose.models.ActivityEvent || mongoose.model('ActivityEvent', activityEventSchema);
