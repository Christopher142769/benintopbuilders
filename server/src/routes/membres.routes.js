import { Router } from 'express';
import * as ctrl from '../controllers/membres.controller.js';

const router = Router();

router.get('/', ctrl.list);
router.get('/near', ctrl.near);
router.get('/markers', ctrl.markers);
router.get('/:slug', ctrl.bySlug);

export default router;
