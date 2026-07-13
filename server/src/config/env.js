import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5001),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/benin-top-builders',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me-32chars',
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me-32chars',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 5),
  fspayBaseUrl: process.env.FSPAY_BASE_URL || '',
  fspayApiKey: process.env.FSPAY_API_KEY || '',
  fspayWebhookSecret: process.env.FSPAY_WEBHOOK_SECRET || 'dev-fspay-webhook-secret',
  fspayCallbackUrl: process.env.FSPAY_CALLBACK_URL || 'http://localhost:5173/paiement/retour',
};

export const isProd = env.nodeEnv === 'production';
