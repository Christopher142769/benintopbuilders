import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { AppError } from '../utils/apiResponse.js';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  randomToken,
  generateOtpCode,
  slugify,
} from '../utils/crypto.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail } from './mail.service.js';
import { env } from '../config/env.js';
import { TARIFS_FCFA } from '../config/constants.js';
import { logger } from '../config/logger.js';
import { initierAdhesionPaiement } from './paiement.service.js';

const REFRESH_COOKIE = 'btb_refresh';

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
}

export { REFRESH_COOKIE };

function publicUser(user) {
  return user.toJSON();
}

async function issueSession(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  return { accessToken, refreshToken, user: publicUser(user) };
}

async function ensureUniqueSlug(base) {
  let slug = slugify(base) || 'membre';
  let i = 0;
  while (await User.exists({ slug: i ? `${slug}-${i}` : slug })) {
    i += 1;
  }
  return i ? `${slug}-${i}` : slug;
}

/** Mémoire OTP en clair — uniquement hors production (tests / sandbox). */
export const __devOtpStore = new Map();

async function createAndSendOtp(email) {
  const code = generateOtpCode();
  await Otp.deleteMany({ email, consumedAt: { $exists: false } });
  await Otp.create({ email, codeHash: hashToken(code) });
  await sendOtpEmail(email, code);
  if (env.nodeEnv !== 'production') {
    __devOtpStore.set(email, code);
    logger.info({ email, otp: code }, 'OTP généré (dev)');
  }
  return code;
}

export async function register(payload) {
  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    throw new AppError('Un compte existe déjà avec cet e-mail', {
      status: 409,
      code: 'EMAIL_EXISTS',
    });
  }

  const passwordHash = await hashPassword(payload.password);
  const baseName =
    payload.entreprise || `${payload.prenom}-${payload.nom}` || payload.email.split('@')[0];
  const slug = await ensureUniqueSlug(baseName);

  const user = await User.create({
    email: payload.email,
    passwordHash,
    role: 'visiteur',
    statut: 'pending_otp',
    profilType: payload.profilType,
    prenom: payload.prenom,
    nom: payload.nom,
    telephone: payload.telephone,
    entreprise: payload.entreprise,
    ifu: payload.ifu,
    rccm: payload.rccm,
    rccmDocumentUrl: payload.rccmDocumentUrl,
    rccmDocumentNom: payload.rccmDocumentNom,
    departement: payload.departement,
    ville: payload.ville,
    zonesIntervention: payload.zonesIntervention || [],
    presentation: payload.presentation,
    metiers: payload.metiers || [],
    slug,
  });

  await createAndSendOtp(user.email);

  return {
    user: publicUser(user),
    nextStep: 'otp',
    message: 'Compte créé. Vérifiez votre e-mail pour le code OTP.',
  };
}

export async function verifyOtp({ email, code }) {
  const user = await User.findOne({ email });
  if (!user) throw new AppError('Compte introuvable', { status: 404, code: 'NOT_FOUND' });
  if (user.statut !== 'pending_otp') {
    throw new AppError('OTP déjà validé ou non requis', { status: 400, code: 'OTP_NOT_REQUIRED' });
  }

  const otp = await Otp.findOne({ email, consumedAt: null }).sort({ createdAt: -1 });
  if (!otp) {
    throw new AppError('Code expiré ou introuvable', { status: 400, code: 'OTP_EXPIRED' });
  }
  if (otp.tentatives >= otp.maxTentatives) {
    throw new AppError('Nombre d\'essais dépassé', { status: 429, code: 'OTP_MAX_ATTEMPTS' });
  }

  const ok = hashToken(code) === otp.codeHash;
  if (!ok) {
    otp.tentatives += 1;
    await otp.save();
    throw new AppError('Code incorrect', {
      status: 400,
      code: 'OTP_INVALID',
      details: { tentativesRestantes: otp.maxTentatives - otp.tentatives },
    });
  }

  otp.consumedAt = new Date();
  await otp.save();

  user.statut = 'pending_charte';
  user.emailVerifieAt = new Date();
  await user.save();

  const session = await issueSession(user);
  return {
    ...session,
    nextStep: 'charte',
  };
}

export async function resendOtp(email) {
  const user = await User.findOne({ email });
  if (!user) throw new AppError('Compte introuvable', { status: 404, code: 'NOT_FOUND' });
  if (user.statut !== 'pending_otp') {
    throw new AppError('OTP non requis', { status: 400, code: 'OTP_NOT_REQUIRED' });
  }

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await Otp.countDocuments({ email, createdAt: { $gte: since } });
  if (recent >= 3) {
    throw new AppError('Limite de renvois atteinte (3/heure)', {
      status: 429,
      code: 'OTP_RESEND_LIMIT',
    });
  }

  await createAndSendOtp(email);
  return { message: 'Nouveau code envoyé' };
}

export async function acceptCharte(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Compte introuvable', { status: 404, code: 'NOT_FOUND' });
  if (user.statut !== 'pending_charte') {
    throw new AppError('Charte déjà acceptée ou étape incorrecte', {
      status: 400,
      code: 'INVALID_STATUS',
    });
  }
  user.charteAccepteeAt = new Date();
  user.statut = 'pending_paiement';
  await user.save();
  return { user: publicUser(user), nextStep: 'paiement' };
}

/** Sélection de palier — Découverte active immédiatement ; les autres attendent FSPay (étape 4). */
export async function selectPalier(userId, palier) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Compte introuvable', { status: 404, code: 'NOT_FOUND' });
  if (user.statut !== 'pending_paiement' && user.statut !== 'actif' && user.statut !== 'expire') {
    throw new AppError('Étape palier non disponible', { status: 400, code: 'INVALID_STATUS' });
  }

  const montant = TARIFS_FCFA.adhesion[palier] ?? 0;
  user.palier = palier;

  if (montant === 0) {
    user.statut = 'actif';
    user.role = user.role === 'visiteur' ? 'membre' : user.role;
    user.adhesionExpireAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    if (user.profilType !== 'maitre_ouvrage') {
      user.fichePubliee = true;
    }
    await user.save();
    await sendWelcomeEmail(user);
    return {
      user: publicUser(user),
      needsPayment: false,
      montant: 0,
      nextStep: 'dashboard',
    };
  }

  await user.save();
  const pay = await initierAdhesionPaiement(user, palier, 'sandbox');
  return {
    user: publicUser(user),
    needsPayment: true,
    montant,
    nextStep: 'paiement_fspay',
    paiement: pay.paiement,
    checkoutUrl: pay.checkoutUrl,
    sandbox: pay.sandbox,
    message: 'Redirection vers le paiement FSPay',
  };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Identifiants incorrects', { status: 401, code: 'INVALID_CREDENTIALS' });
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Identifiants incorrects', { status: 401, code: 'INVALID_CREDENTIALS' });
  }
  if (user.statut === 'suspendu') {
    throw new AppError('Compte suspendu', { status: 403, code: 'ACCOUNT_SUSPENDED' });
  }

  const session = await issueSession(user);
  return {
    ...session,
    redirect: redirectForStatut(user.statut, user.role),
  };
}

function redirectForStatut(statut, role) {
  if (role === 'admin' || role === 'superadmin') return '/admin';
  switch (statut) {
    case 'pending_otp':
      return '/inscription?etape=otp';
    case 'pending_charte':
      return '/inscription?etape=charte';
    case 'pending_paiement':
      return '/inscription?etape=paiement';
    case 'expire':
      return '/dashboard?reactiver=1';
    default:
      return '/dashboard';
  }
}

export async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Refresh token manquant', { status: 401, code: 'REFRESH_MISSING' });
  }
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub);
  if (!user || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new AppError('Session invalide', { status: 401, code: 'REFRESH_INVALID' });
  }
  return issueSession(user);
}

export async function logout(userId) {
  if (userId) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
  }
}

export async function forgotPassword(email) {
  const user = await User.findOne({ email });
  // Ne pas révéler l'existence du compte
  if (!user) return { message: 'Si un compte existe, un e-mail a été envoyé' };

  const token = randomToken(32);
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpireAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${env.clientUrl}/reinitialiser-mot-de-passe?token=${token}`;
  await sendPasswordResetEmail(email, resetUrl);
  if (env.nodeEnv !== 'production') {
    logger.info({ email, resetUrl }, 'Lien reset (dev)');
  }
  return { message: 'Si un compte existe, un e-mail a été envoyé' };
}

export async function resetPassword({ token, password }) {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpireAt: { $gt: new Date() },
  });
  if (!user) {
    throw new AppError('Lien de réinitialisation invalide ou expiré', {
      status: 400,
      code: 'RESET_INVALID',
    });
  }
  user.passwordHash = await hashPassword(password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpireAt = undefined;
  user.refreshTokenHash = undefined;
  await user.save();
  return { message: 'Mot de passe mis à jour' };
}

export async function me(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Introuvable', { status: 404, code: 'NOT_FOUND' });
  return publicUser(user);
}

/** Exposé pour les tests : récupérer l'OTP en clair depuis les logs n'est pas fiable — helper test only */
export async function __testGetLatestOtpCode(email) {
  const otp = await Otp.findOne({ email }).sort({ createdAt: -1 });
  return otp;
}

export { createAndSendOtp };
