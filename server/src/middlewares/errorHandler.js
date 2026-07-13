import { AppError, fail } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export function notFoundHandler(req, res) {
  return fail(res, 404, 'NOT_FOUND', `Route introuvable : ${req.method} ${req.originalUrl}`);
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return fail(res, 422, 'VALIDATION_ERROR', 'Données invalides', err.flatten());
  }

  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err }, err.message);
    return fail(res, err.status, err.code, err.message, err.details);
  }

  if (err?.name === 'CastError') {
    return fail(res, 400, 'INVALID_ID', 'Identifiant invalide');
  }

  if (err?.code === 11000) {
    return fail(res, 409, 'DUPLICATE', 'Ressource déjà existante', err.keyValue);
  }

  logger.error({ err }, 'Unhandled error');
  return fail(
    res,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message || 'Erreur interne'
  );
}
