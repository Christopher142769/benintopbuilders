import { Router } from 'express';
import * as ctrl from '../controllers/adhesion.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate);
router.get('/paiements', ctrl.historique);
router.post('/renouvellement-auto', ctrl.renewal);
router.post('/changer-palier', ctrl.changerPalier);

export default router;
