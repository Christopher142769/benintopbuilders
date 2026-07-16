import { Router } from 'express';
import * as ctrl from '../controllers/formations.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { uploadFlexible } from '../middlewares/upload.js';

const router = Router();

router.get('/', ctrl.catalogue);
router.get('/mes-inscriptions', authenticate, ctrl.mesInscriptions);
router.get('/:id/parcours', authenticate, ctrl.parcours);
router.post('/:id/chapitres/:chapterId/terminer', authenticate, ctrl.terminerChapitre);
router.post(
  '/:id/evaluations',
  authenticate,
  uploadFlexible.any(),
  ctrl.soumettreEvaluation
);
router.post('/:id/inscriptions', authenticate, ctrl.inscrire);
router.post(
  '/inscriptions/:inscriptionId/emarger',
  authenticate,
  requireRole('admin', 'superadmin'),
  ctrl.emarger
);

export default router;
