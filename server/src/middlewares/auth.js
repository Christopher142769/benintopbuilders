import { User } from '../models/User.js';
import { ActivityEvent } from '../models/ActivityEvent.js';
import { AppError } from '../utils/apiResponse.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    throw new AppError('Authentification requise', { status: 401, code: 'UNAUTHORIZED' });
  }
  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError('Utilisateur introuvable', { status: 401, code: 'UNAUTHORIZED' });
  }
  if (user.statut === 'suspendu') {
    throw new AppError('Compte suspendu', { status: 403, code: 'ACCOUNT_SUSPENDED' });
  }
  req.user = user;
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  void Promise.all([
    User.updateOne({ _id: user._id }, { $set: { lastActiveAt: now } }),
    ActivityEvent.updateOne(
      { userId: user._id, day, hour: now.getUTCHours() },
      {
        $inc: { requests: 1 },
        $set: { lastSeenAt: now, lastPath: req.originalUrl?.slice(0, 300) },
        $setOnInsert: { userId: user._id, day, hour: now.getUTCHours() },
      },
      { upsert: true }
    ),
  ]).catch(() => {});
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user && user.statut !== 'suspendu') req.user = user;
  } catch {
    // ignore
  }
  next();
});

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentification requise', { status: 401, code: 'UNAUTHORIZED' }));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Accès refusé', { status: 403, code: 'FORBIDDEN' }));
    }
    next();
  };
}

export function requireStatut(...statuts) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentification requise', { status: 401, code: 'UNAUTHORIZED' }));
    }
    if (!statuts.includes(req.user.statut)) {
      return next(
        new AppError(`Statut requis : ${statuts.join(' | ')}`, {
          status: 403,
          code: 'INVALID_STATUS',
          details: { statut: req.user.statut },
        })
      );
    }
    next();
  };
}
