import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import * as svc from '../services/notifications.service.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    return ok(res, await svc.listNotifications(req.user._id, req.query), 'OK');
  })
);
router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    return ok(res, { total: await svc.unreadCount(req.user._id) }, 'OK');
  })
);
router.post(
  '/:id/lu',
  asyncHandler(async (req, res) => {
    return ok(res, await svc.marquerLu(req.user._id, req.params.id), 'OK');
  })
);
router.post(
  '/lire-toutes',
  asyncHandler(async (req, res) => {
    await svc.marquerToutesLues(req.user._id);
    return ok(res, null, 'OK');
  })
);

export default router;
