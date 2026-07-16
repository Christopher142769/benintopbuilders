import { Router } from 'express';
import * as ctrl from '../controllers/label.controller.js';
import { authenticate, requireStatut } from '../middlewares/auth.js';
import { uploadFlexible } from '../middlewares/upload.js';

const router = Router();

router.post(
  '/dossiers-label',
  authenticate,
  requireStatut('actif'),
  uploadFlexible.any(),
  ctrl.create
);
router.get('/dossier', authenticate, ctrl.mine);
router.get('/label-formulaires/:niveau', authenticate, ctrl.form);

export default router;
