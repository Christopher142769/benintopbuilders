import { Router } from 'express';
import * as ctrl from '../controllers/formations.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
router.post('/', authenticate, ctrl.avisCreate);
router.post('/:id/signaler', authenticate, ctrl.avisSignaler);

export default router;
