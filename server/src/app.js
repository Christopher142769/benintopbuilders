import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origine CORS refusée : ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: 'RATE_LIMIT', message: 'Trop de requêtes, réessayez plus tard.' },
      },
    })
  );

  app.use((req, _res, next) => {
    logger.debug({ method: req.method, url: req.originalUrl }, 'request');
    next();
  });

  const uploadPath = path.resolve(__dirname, '..', env.uploadDir);
  app.use('/uploads', express.static(uploadPath));

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
