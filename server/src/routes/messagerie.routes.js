import { Router } from 'express';
import * as ctrl from '../controllers/messagerie.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate);
router.get('/', ctrl.list);
router.post('/', ctrl.open);
router.get('/unread', ctrl.unread);
router.get('/:id/messages', ctrl.messages);
router.post('/:id/messages', ctrl.send);
router.post('/:id/read', ctrl.read);

export default router;
