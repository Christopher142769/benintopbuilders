import crypto from 'crypto';
import { Paiement } from '../models/Paiement.js';
import { User } from '../models/User.js';
import { DossierLabel } from '../models/DossierLabel.js';
import { Commande } from '../models/Commande.js';
import { InscriptionFormation } from '../models/InscriptionFormation.js';
import { AppError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { sendMail, sendWelcomeEmail } from './mail.service.js';
import { TARIFS_FCFA } from '../config/constants.js';

const TYPE_CODE = {
  adhesion: 'ADHESION',
  renouvellement: 'RENOUV',
  labellisation: 'LABEL',
  commande: 'CMD',
  formation: 'FORMA',
  visibilite: 'VISIB',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry(fn, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i += 1) {
    try {
      return await fn(i);
    } catch (err) {
      lastErr = err;
      logger.warn({ err, attempt: i + 1 }, 'Retry paiement FSPay');
      await sleep(150 * (i + 1));
    }
  }
  throw lastErr;
}

async function nextRefInterne(type) {
  const year = new Date().getFullYear();
  const code = TYPE_CODE[type] || 'PAY';
  const prefix = `BTB-${code}-${year}-`;
  const count = await Paiement.countDocuments({
    refInterne: new RegExp(`^${prefix}`),
  });
  const n = String(count + 1).padStart(5, '0');
  return `${prefix}${n}`;
}

export function signWebhookPayload(body, secret = env.fspayWebhookSecret) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return crypto.createHmac('sha256', secret).update(raw).digest('hex');
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!signature) return false;
  const expected = signWebhookPayload(rawBody, env.fspayWebhookSecret);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function envoyerRecu(paiement, user) {
  const subject = `Reçu BTB ${paiement.refInterne}`;
  const text = `Paiement ${paiement.statut} — ${paiement.montant} FCFA — ${paiement.refInterne}`;
  const html = `<p>Bonjour ${user.prenom || ''},</p>
    <p>Votre paiement <strong>${paiement.refInterne}</strong> (${paiement.type}) est
    <strong>${paiement.statut}</strong> pour un montant de <strong>${paiement.montant} FCFA</strong>.</p>`;
  await sendMail({ to: user.email, subject, html, text });
}

async function activerAdhesion(user, palier) {
  user.palier = palier;
  user.statut = 'actif';
  if (user.role === 'visiteur') user.role = 'membre';
  user.adhesionExpireAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  if (user.profilType !== 'maitre_ouvrage') user.fichePubliee = true;
  await user.save();
  await sendWelcomeEmail(user);
}

async function dispatchSucces(paiement) {
  const user = await User.findById(paiement.userId);
  if (!user) return;

  switch (paiement.type) {
    case 'adhesion':
    case 'renouvellement': {
      const palier = paiement.meta?.palier || user.palier || 'standard';
      if (paiement.type === 'renouvellement' && user.adhesionExpireAt) {
        const base = user.adhesionExpireAt > new Date() ? user.adhesionExpireAt : new Date();
        user.adhesionExpireAt = new Date(base.getTime() + 365 * 24 * 60 * 60 * 1000);
        user.palier = palier;
        user.statut = 'actif';
        if (user.role === 'visiteur') user.role = 'membre';
        await user.save();
      } else {
        await activerAdhesion(user, palier);
      }
      break;
    }
    case 'labellisation': {
      if (paiement.meta?.dossierLabelId) {
        await DossierLabel.findByIdAndUpdate(paiement.meta.dossierLabelId, {
          $set: { statut: 'soumis' },
          $push: {
            historique: { statut: 'soumis', note: 'Paiement audit reçu — dossier visible admin' },
          },
        });
      }
      break;
    }
    case 'commande': {
      if (paiement.meta?.commandeId) {
        await Commande.findByIdAndUpdate(paiement.meta.commandeId, {
          statut: 'payee',
        });
      }
      break;
    }
    case 'formation': {
      if (paiement.meta?.inscriptionFormationId) {
        const insc = await InscriptionFormation.findByIdAndUpdate(
          paiement.meta.inscriptionFormationId,
          { statut: 'confirmee' },
          { new: true }
        );
        if (insc) {
          const { Formation } = await import('../models/Formation.js');
          await Formation.findByIdAndUpdate(insc.formationId, {
            $inc: { placesRestantes: -insc.nbParticipants },
          });
        }
      }
      break;
    }
    default:
      break;
  }

  await envoyerRecu(paiement, user);
}

/**
 * Initie un paiement FSPay (sandbox si FSPAY_BASE_URL absent).
 * @returns {Promise<{paiement, checkoutUrl, sandbox:boolean}>}
 */
export async function initierPaiement({
  userId,
  type,
  montant,
  moyen = 'sandbox',
  meta = {},
}) {
  if (!userId) throw new AppError('userId requis', { status: 400, code: 'VALIDATION_ERROR' });
  if (montant < 0) throw new AppError('Montant invalide', { status: 400, code: 'VALIDATION_ERROR' });

  const refInterne = await withRetry(() => nextRefInterne(type));

  const paiement = await Paiement.create({
    refInterne,
    type,
    montant,
    userId,
    moyen: env.fspayBaseUrl ? moyen : 'sandbox',
    meta,
    statut: 'en_cours',
  });

  const sandbox = !env.fspayBaseUrl;
  let checkoutUrl = `${env.clientUrl}/paiement/retour?ref=${encodeURIComponent(refInterne)}`;

  if (sandbox) {
    // Succès simulé en ~2s (désactivé en tests pour contrôles manuels)
    if (env.nodeEnv !== 'test') {
      setTimeout(() => {
        traiterWebhook({
          eventId: `sandbox-${paiement._id}-${Date.now()}`,
          refInterne,
          status: 'success',
          fspayRef: `SBX-${refInterne}`,
          amount: montant,
        }).catch((err) => logger.error({ err }, 'Sandbox webhook échoué'));
      }, 2000);
    }
  } else {
    const remote = await withRetry(async () => {
      const res = await fetch(`${env.fspayBaseUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.fspayApiKey}`,
        },
        body: JSON.stringify({
          reference: refInterne,
          amount: montant,
          currency: 'XOF',
          callbackUrl: env.fspayCallbackUrl,
          customerId: String(userId),
          metadata: { type, ...meta },
        }),
      });
      if (!res.ok) throw new Error(`FSPay HTTP ${res.status}`);
      return res.json();
    });
    paiement.fspayRef = remote.id || remote.reference;
    paiement.fspayPayload = remote;
    checkoutUrl = remote.checkoutUrl || remote.paymentUrl || checkoutUrl;
    await paiement.save();
  }

  return { paiement, checkoutUrl, sandbox };
}

/**
 * Traite un webhook FSPay (idempotent).
 */
export async function traiterWebhook(payload) {
  const refInterne = payload.refInterne || payload.reference;
  const eventId = payload.eventId || payload.id || `${refInterne}-${payload.status}`;

  const paiement = await Paiement.findOne({ refInterne });
  if (!paiement) {
    throw new AppError('Paiement introuvable', { status: 404, code: 'NOT_FOUND' });
  }

  // Idempotence stricte
  if (paiement.webhookProcessed && paiement.statut === 'reussi') {
    return { paiement, alreadyProcessed: true };
  }
  if (paiement.lastWebhookEventId === eventId) {
    return { paiement, alreadyProcessed: true };
  }

  paiement.webhookEvents.push({ eventId, payload });
  paiement.lastWebhookEventId = eventId;

  const status = String(payload.status || '').toLowerCase();
  const success = ['success', 'succeeded', 'paid', 'reussi'].includes(status);

  if (success) {
    paiement.statut = 'reussi';
    paiement.payeAt = new Date();
    paiement.fspayRef = payload.fspayRef || paiement.fspayRef;
    paiement.webhookProcessed = true;
    await paiement.save();
    await dispatchSucces(paiement);
  } else {
    paiement.statut = 'echec';
    paiement.echecMotif = payload.motif || payload.message || 'Échec paiement';
    await paiement.save();
  }

  return { paiement, alreadyProcessed: false };
}

export async function getPaiementByRef(refInterne) {
  const paiement = await Paiement.findOne({ refInterne });
  if (!paiement) throw new AppError('Paiement introuvable', { status: 404, code: 'NOT_FOUND' });
  return paiement;
}

export async function initierAdhesionPaiement(user, palier, moyen = 'sandbox') {
  const montant = TARIFS_FCFA.adhesion[palier];
  if (montant == null) throw new AppError('Palier invalide', { status: 400, code: 'VALIDATION_ERROR' });
  if (montant === 0) {
    throw new AppError('Palier gratuit — pas de paiement', { status: 400, code: 'NO_PAYMENT' });
  }
  user.palier = palier;
  await user.save();
  return initierPaiement({
    userId: user._id,
    type: 'adhesion',
    montant,
    moyen,
    meta: { palier },
  });
}
