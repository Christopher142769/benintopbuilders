import { Router } from 'express';
import * as ctrl from '../controllers/formations.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', ctrl.catalogue);
router.get('/mes-inscriptions', authenticate, ctrl.mesInscriptions);
router.post('/:id/inscriptions', authenticate, ctrl.inscrire);
router.post(
  '/inscriptions/:inscriptionId/emarger',
  authenticate,
  requireRole('admin', 'superadmin'),
  ctrl.emarger
);

export default router;
