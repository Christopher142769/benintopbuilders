import { Router } from 'express';
import * as ctrl from '../controllers/trainer.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { uploadDocument } from '../middlewares/upload.js';

const router = Router();
router.use(authenticate, requireRole('formateur'));

router.get('/stats', ctrl.overview);
router.get('/formations', ctrl.formations);
router.post('/formations', ctrl.createFormation);
router.patch('/formations/:id', ctrl.updateFormation);
router.post('/formations/:id/modules', ctrl.addModule);
router.patch('/formations/:id/modules/:moduleId', ctrl.updateModule);
router.delete('/formations/:id/modules/:moduleId', ctrl.deleteModule);
router.post(
  '/formations/:id/modules/:moduleId/chapitres',
  uploadDocument.single('fichier'),
  ctrl.addChapter
);
router.patch(
  '/formations/:id/modules/:moduleId/chapitres/:chapterId',
  uploadDocument.single('fichier'),
  ctrl.updateChapter
);
router.delete(
  '/formations/:id/modules/:moduleId/chapitres/:chapterId',
  ctrl.deleteChapter
);
router.put('/formations/:id/examen', ctrl.setFinalExam);
router.get('/corrections', ctrl.corrections);
router.patch('/corrections/:progressionId/:attemptId', ctrl.correct);

export default router;
