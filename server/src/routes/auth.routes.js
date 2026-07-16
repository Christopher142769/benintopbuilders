import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireStatut } from '../middlewares/auth.js';
import { uploadDocument } from '../middlewares/upload.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Trop de tentatives d\'authentification.' },
  },
});

router.post(
  '/register',
  authLimiter,
  uploadDocument.single('rccm'),
  authController.register
);
router.post('/otp/verify', authLimiter, authController.verifyOtp);
router.post('/otp/resend', authLimiter, authController.resendOtp);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/change-password', authenticate, authLimiter, authController.changePassword);
router.get('/me', authenticate, authController.me);
router.post(
  '/charte/accept',
  authenticate,
  requireStatut('pending_charte'),
  authController.acceptCharte
);
router.post(
  '/adhesion/palier',
  authenticate,
  requireStatut('pending_paiement', 'actif', 'expire'),
  authController.selectPalier
);

export default router;
