import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './apiResponse.js';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      statut: user.statut,
      email: user.email,
    },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpires }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), typ: 'refresh' },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpires }
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtAccessSecret);
  } catch {
    throw new AppError('Token d\'accès invalide ou expiré', { status: 401, code: 'UNAUTHORIZED' });
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.jwtRefreshSecret);
  } catch {
    throw new AppError('Session expirée, reconnectez-vous', { status: 401, code: 'REFRESH_INVALID' });
  }
}
