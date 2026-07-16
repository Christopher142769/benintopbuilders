import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/apiResponse.js';
import { maskContacts, bothParticipantsActifs } from './maskContacts.js';
import { peutMessagerie } from '../config/droits.js';

async function assertMessagerie(userId) {
  const user = await User.findById(userId).select('palier statut role');
  if (!user || user.statut !== 'actif') {
    throw new AppError('Compte inactif', { status: 403, code: 'FORBIDDEN' });
  }
  if (['admin', 'superadmin'].includes(user.role)) return user;
  if (!peutMessagerie(user.palier)) {
    throw new AppError('Messagerie réservée aux formules Standard et plus', {
      status: 403,
      code: 'PALIER_REQUIS',
    });
  }
  return user;
}

export async function ouvrirConversation(userId, { participantId, contexte }) {
  await assertMessagerie(userId);
  if (String(userId) === String(participantId)) {
    throw new AppError('Conversation invalide', { status: 400, code: 'INVALID' });
  }
  const participants = [userId, participantId].sort((a, b) => String(a).localeCompare(String(b)));
  const type = contexte?.type || 'general';
  const filter = {
    participants: { $all: participants, $size: 2 },
    'contexte.type': type,
  };
  if (contexte?.refId) filter['contexte.refId'] = contexte.refId;

  let conv = await Conversation.findOne(filter);
  if (!conv) {
    conv = await Conversation.create({
      participants,
      contexte: { type, refId: contexte?.refId, label: contexte?.label },
    });
  }
  return conv;
}

export async function listConversations(userId) {
  await assertMessagerie(userId);
  return Conversation.find({ participants: userId })
    .sort({ dernierMessageAt: -1 })
    .populate('participants', 'prenom nom entreprise slug statut role palier');
}

export async function listMessages(userId, conversationId, { page = 1, limit = 50 } = {}) {
  const conv = await Conversation.findById(conversationId).populate('participants', 'statut role');
  if (!conv || !conv.participants.some((p) => String(p._id) === String(userId))) {
    throw new AppError('Conversation introuvable', { status: 404, code: 'NOT_FOUND' });
  }
  const bothActive = bothParticipantsActifs(conv.participants);
  const skip = (Number(page) - 1) * Number(limit);
  const rows = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  return rows.reverse().map((m) => ({
    ...m,
    corps: maskContacts(m.corps, { bothActive }),
  }));
}

export async function envoyerMessage(userId, conversationId, corps) {
  await assertMessagerie(userId);
  const conv = await Conversation.findById(conversationId);
  if (!conv || !conv.participants.some((p) => String(p) === String(userId))) {
    throw new AppError('Conversation introuvable', { status: 404, code: 'NOT_FOUND' });
  }
  const msg = await Message.create({
    conversationId,
    auteurId: userId,
    corps,
  });
  conv.dernierMessageAt = new Date();
  conv.dernierMessageApercu = corps.slice(0, 120);
  const other = conv.participants.find((p) => String(p) !== String(userId));
  if (other) {
    const cur = conv.nonLus?.get?.(String(other)) || 0;
    conv.nonLus.set(String(other), cur + 1);
  }
  await conv.save();
  return msg;
}

export async function marquerLu(userId, conversationId) {
  const conv = await Conversation.findById(conversationId);
  if (!conv) return null;
  conv.nonLus.set(String(userId), 0);
  await conv.save();
  await Message.updateMany(
    { conversationId, auteurId: { $ne: userId }, luPar: { $ne: userId } },
    { $addToSet: { luPar: userId } }
  );
  return conv;
}

export async function unreadTotal(userId) {
  const convs = await Conversation.find({ participants: userId });
  return convs.reduce((s, c) => s + (c.nonLus?.get?.(String(userId)) || 0), 0);
}
