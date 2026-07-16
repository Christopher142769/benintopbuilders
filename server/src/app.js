import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { env, isProd } from './config/env.js';
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
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

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

  // En production (Hostinger Node.js Web App) : un seul processus sert l'API + le build React.
  if (isProd) {
    const clientDist = path.resolve(__dirname, '../../client/dist');
    if (fs.existsSync(path.join(clientDist, 'index.html'))) {
      app.use(express.static(clientDist, { index: false }));
      app.get('*', (req, res, next) => {
        if (
          req.path.startsWith('/api') ||
          req.path.startsWith('/uploads') ||
          req.path.startsWith('/socket.io')
        ) {
          return next();
        }
        res.sendFile(path.join(clientDist, 'index.html'), (err) => {
          if (err) next(err);
        });
      });
    }
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
