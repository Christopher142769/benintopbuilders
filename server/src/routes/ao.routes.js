import { Router } from 'express';
import * as ctrl from '../controllers/ao.controller.js';
import { authenticate, requireStatut } from '../middlewares/auth.js';

const router = Router();

router.get('/', ...ctrl.list);
router.post('/', authenticate, requireStatut('actif'), ctrl.create);
router.get('/mes-reponses', authenticate, ctrl.mesReponses);
router.get('/mes-ao', authenticate, ctrl.mesAO);
router.get('/:id', ctrl.getOne);
router.patch('/:id', authenticate, ctrl.update);
router.post('/:id/reponses', authenticate, requireStatut('actif'), ctrl.repondre);
router.get('/:id/reponses', authenticate, ctrl.reponses);
router.patch('/reponses/:reponseId', authenticate, ctrl.setReponseStatut);

export default router;
