import { Router } from 'express';
import * as ctrl from '../controllers/paiement.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/webhook', ctrl.webhook);
router.post('/adhesion', authenticate, ctrl.initAdhesion);
router.get('/:ref', authenticate, ctrl.getByRef);
router.post('/:ref/relancer', authenticate, ctrl.relancer);

export default router;
