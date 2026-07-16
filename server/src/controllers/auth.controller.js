import { ok, created } from '../utils/apiResponse.js';
import { AppError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { saveDocument } from '../services/upload.service.js';
import {
  registerSchema,
  otpVerifySchema,
  otpResendSchema,
  loginSchema,
  palierSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validators.js';

function parseRegisterBody(raw) {
  const body = { ...raw };
  if (typeof body.zonesIntervention === 'string') {
    try {
      body.zonesIntervention = JSON.parse(body.zonesIntervention);
    } catch {
      body.zonesIntervention = body.zonesIntervention
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  if (typeof body.metiers === 'string') {
    try {
      body.metiers = JSON.parse(body.metiers);
    } catch {
      body.metiers = body.metiers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return body;
}

export const register = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(parseRegisterBody(req.body));

  const needsRccmFile = body.profilType !== 'maitre_ouvrage';
  if (needsRccmFile && !req.file) {
    throw new AppError('Le fichier RCCM (PDF, DOC ou DOCX) est obligatoire', {
      status: 422,
      code: 'RCCM_REQUIRED',
    });
  }

  if (req.file) {
    const saved = await saveDocument(req.file, {
      folder: 'rccm',
      filenamePrefix: 'rccm',
    });
    body.rccmDocumentUrl = saved.url;
    body.rccmDocumentNom = saved.nomOriginal;
  }

  const data = await authService.register(body);
  return created(res, data, data.message);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const body = otpVerifySchema.parse(req.body);
  const data = await authService.verifyOtp(body);
  res.cookie(authService.REFRESH_COOKIE, data.refreshToken, authService.refreshCookieOptions());
  return ok(
    res,
    {
      accessToken: data.accessToken,
      user: data.user,
      nextStep: data.nextStep,
    },
    'E-mail vérifié'
  );
});

export const resendOtp = asyncHandler(async (req, res) => {
  const body = otpResendSchema.parse(req.body);
  const data = await authService.resendOtp(body.email);
  return ok(res, data, data.message);
});

export const acceptCharte = asyncHandler(async (req, res) => {
  const data = await authService.acceptCharte(req.user._id);
  return ok(res, data, 'Charte acceptée');
});

export const selectPalier = asyncHandler(async (req, res) => {
  const body = palierSchema.parse(req.body);
  const data = await authService.selectPalier(req.user._id, body.palier);
  return ok(
    res,
    {
      user: data.user,
      needsPayment: data.needsPayment,
      montant: data.montant,
      nextStep: data.nextStep,
      paiement: data.paiement,
      checkoutUrl: data.checkoutUrl,
      sandbox: data.sandbox,
    },
    data.needsPayment ? 'Paiement requis' : 'Adhésion activée'
  );
});

export const login = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const data = await authService.login(body);
  res.cookie(authService.REFRESH_COOKIE, data.refreshToken, authService.refreshCookieOptions());
  return ok(
    res,
    {
      accessToken: data.accessToken,
      user: data.user,
      redirect: data.redirect,
    },
    'Connexion réussie'
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[authService.REFRESH_COOKIE] || req.body?.refreshToken;
  const data = await authService.refresh(token);
  res.cookie(authService.REFRESH_COOKIE, data.refreshToken, authService.refreshCookieOptions());
  return ok(res, { accessToken: data.accessToken, user: data.user }, 'Token renouvelé');
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user?._id);
  res.clearCookie(authService.REFRESH_COOKIE, { path: '/api/auth' });
  return ok(res, null, 'Déconnexion réussie');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const body = forgotPasswordSchema.parse(req.body);
  const data = await authService.forgotPassword(body.email);
  return ok(res, data, data.message);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const body = resetPasswordSchema.parse(req.body);
  const data = await authService.resetPassword(body);
  return ok(res, data, data.message);
});

export const changePassword = asyncHandler(async (req, res) => {
  const body = changePasswordSchema.parse(req.body);
  const data = await authService.changePassword(req.user._id, body);
  res.clearCookie(authService.REFRESH_COOKIE, { path: '/api/auth' });
  return ok(res, data, data.message);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user._id);
  return ok(res, { user }, 'OK');
});
