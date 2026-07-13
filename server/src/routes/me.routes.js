import { Router } from 'express';
import * as ctrl from '../controllers/membres.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { uploadImage } from '../middlewares/upload.js';

const router = Router();

router.patch('/profil', authenticate, ctrl.updateProfil);
router.post('/logo', authenticate, uploadImage.single('logo'), ctrl.uploadLogo);
router.post('/references', authenticate, uploadImage.single('photo'), ctrl.uploadReferencePhoto);

export default router;
