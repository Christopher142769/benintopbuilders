import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate, requireRole('admin', 'superadmin'));

router.get('/dossiers', ctrl.dossiers);
router.patch('/dossiers/:id', ctrl.dossierTransition);
router.get('/label-formulaires', ctrl.labelFormulaires);
router.post('/label-formulaires', ctrl.createLabelFormulaire);
router.patch('/label-formulaires/:id', ctrl.updateLabelFormulaire);
router.delete('/label-formulaires/:id', ctrl.deleteLabelFormulaire);
router.get('/membres', ctrl.membres);
router.post('/membres/:id/suspendre', ctrl.suspendre);
router.post('/membres/:id/reactiver', ctrl.reactiver);
router.get('/formateurs', ctrl.formateurs);
router.post('/formateurs', ctrl.createFormateur);
router.patch('/formateurs/:id', ctrl.updateFormateur);
router.get('/moderation/avis', ctrl.avisModeration);
router.patch('/moderation/avis/:id', ctrl.avisDecision);
router.get('/moderation/prix-anormaux', ctrl.prixAnormaux);
router.get('/moderation/ao-doublons', ctrl.aoDoublons);
router.get('/stats', ctrl.stats);
router.get('/audit', ctrl.audit);

export default router;
