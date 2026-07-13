import mongoose from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.js';

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    tentatives: { type: Number, default: 0 },
    maxTentatives: { type: Number, default: 5 },
    renvois: { type: Number, default: 0 },
    consumedAt: Date,
  },
  { timestamps: true }
);

// TTL 10 minutes
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });
otpSchema.index({ email: 1, createdAt: -1 });

otpSchema.plugin(toJSONPlugin);

export const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
