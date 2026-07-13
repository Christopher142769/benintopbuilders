import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import paiementRoutes from './paiement.routes.js';
import membresRoutes from './membres.routes.js';
import meRoutes from './me.routes.js';
import labelRoutes from './label.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/paiements', paiementRoutes);
router.use('/membres', membresRoutes);
router.use('/me', meRoutes);
router.use('/me', labelRoutes);

export default router;
