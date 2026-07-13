import { Notification } from '../models/Notification.js';
import { AppError } from '../utils/apiResponse.js';

export async function listNotifications(userId, { unreadOnly } = {}) {
  const filter = { userId };
  if (unreadOnly === 'true' || unreadOnly === true) filter.lu = false;
  return Notification.find(filter).sort({ createdAt: -1 }).limit(50);
}

export async function marquerLu(userId, id) {
  const n = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { $set: { lu: true } },
    { new: true }
  );
  if (!n) throw new AppError('Notification introuvable', { status: 404, code: 'NOT_FOUND' });
  return n;
}

export async function marquerToutesLues(userId) {
  await Notification.updateMany({ userId, lu: false }, { $set: { lu: true } });
}

export async function unreadCount(userId) {
  return Notification.countDocuments({ userId, lu: false });
}
