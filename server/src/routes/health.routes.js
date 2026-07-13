import { Router } from 'express';
import mongoose from 'mongoose';
import { ok } from '../utils/apiResponse.js';

const router = Router();

router.get('/', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbLabel = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }[dbState];

  return ok(res, {
    status: 'ok',
    service: 'benin-top-builders-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbLabel,
  }, 'API opérationnelle');
});

export default router;
