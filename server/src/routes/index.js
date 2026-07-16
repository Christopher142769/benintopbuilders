import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import paiementRoutes from './paiement.routes.js';
import membresRoutes from './membres.routes.js';
import meRoutes from './me.routes.js';
import labelRoutes from './label.routes.js';
import aoRoutes from './ao.routes.js';
import marketplaceRoutes from './marketplace.routes.js';
import messagerieRoutes from './messagerie.routes.js';
import formationsRoutes from './formations.routes.js';
import avisRoutes from './avis.routes.js';
import adhesionRoutes from './adhesion.routes.js';
import adminRoutes from './admin.routes.js';
import notificationsRoutes from './notifications.routes.js';
import trainerRoutes from './trainer.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/paiements', paiementRoutes);
router.use('/membres', membresRoutes);
router.use('/me', meRoutes);
router.use('/me', labelRoutes);
router.use('/me/adhesion', adhesionRoutes);
router.use('/appels-offres', aoRoutes);
router.use('/materiaux', marketplaceRoutes);
router.use('/messagerie', messagerieRoutes);
router.use('/formations', formationsRoutes);
router.use('/avis', avisRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/formateur', trainerRoutes);

export default router;
