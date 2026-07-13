import mongoose from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.js';

const auditLogSchema = new mongoose.Schema(
  {
    acteurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    ressource: { type: String, required: true, index: true },
    ressourceId: { type: mongoose.Schema.Types.ObjectId, index: true },
    details: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.plugin(toJSONPlugin);

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
