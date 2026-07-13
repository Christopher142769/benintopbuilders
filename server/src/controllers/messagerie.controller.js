import { ok, created } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as msg from '../services/messagerie.service.js';
import { z } from 'zod';

export const list = asyncHandler(async (req, res) => {
  return ok(res, await msg.listConversations(req.user._id), 'OK');
});

export const open = asyncHandler(async (req, res) => {
  const body = z
    .object({
      participantId: z.string(),
      contexte: z
        .object({
          type: z.enum(['annuaire', 'fiche', 'ao', 'commande', 'general']).optional(),
          refId: z.string().optional(),
          label: z.string().optional(),
        })
        .optional(),
    })
    .parse(req.body);
  const conv = await msg.ouvrirConversation(req.user._id, body);
  return created(res, conv, 'Conversation ouverte');
});

export const messages = asyncHandler(async (req, res) => {
  const data = await msg.listMessages(req.user._id, req.params.id, req.query);
  return ok(res, data, 'OK');
});

export const send = asyncHandler(async (req, res) => {
  const body = z.object({ corps: z.string().min(1).max(5000) }).parse(req.body);
  const m = await msg.envoyerMessage(req.user._id, req.params.id, body.corps);
  // emit socket if available
  const io = req.app.get('io');
  if (io) io.to(`conv:${req.params.id}`).emit('message:new', m);
  return created(res, m, 'Message envoyé');
});

export const read = asyncHandler(async (req, res) => {
  await msg.marquerLu(req.user._id, req.params.id);
  const io = req.app.get('io');
  if (io) io.to(`conv:${req.params.id}`).emit('conv:read', { conversationId: req.params.id, userId: req.user._id });
  return ok(res, null, 'Lu');
});

export const unread = asyncHandler(async (req, res) => {
  return ok(res, { total: await msg.unreadTotal(req.user._id) }, 'OK');
});
