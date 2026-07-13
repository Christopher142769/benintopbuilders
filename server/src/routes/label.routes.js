import { Router } from 'express';
import * as ctrl from '../controllers/label.controller.js';
import { authenticate, requireStatut } from '../middlewares/auth.js';
import { uploadImage } from '../middlewares/upload.js';

const router = Router();

const pieceFields = [
  { name: 'ifu', maxCount: 1 },
  { name: 'rccm', maxCount: 1 },
  { name: 'cnss', maxCount: 1 },
  { name: 'assurance', maxCount: 1 },
  { name: 'references', maxCount: 1 },
];

router.post(
  '/dossiers-label',
  authenticate,
  requireStatut('actif'),
  uploadImage.fields(pieceFields),
  ctrl.create
);
router.get('/dossier', authenticate, ctrl.mine);

export default router;
