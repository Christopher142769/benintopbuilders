import { User } from '../models/User.js';
import { Paiement } from '../models/Paiement.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { initierPaiement } from './paiement.service.js';
import { TARIFS_FCFA } from '../config/constants.js';
import { sendMail } from './mail.service.js';
import { env } from '../config/env.js';

function dayStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function audit(action, meta = {}) {
  await AuditLog.create({
    action,
    acteurId: meta.acteurId || null,
    ressource: 'User',
    ressourceId: meta.userId,
    details: meta,
  });
}

export async function runAdhesionLifecycle(now = new Date()) {
  const today = dayStart(now);
  const j15 = new Date(today);
  j15.setDate(j15.getDate() + 15);
  const j15End = new Date(j15);
  j15End.setDate(j15End.getDate() + 1);

  const j0Start = today;
  const j0End = new Date(today);
  j0End.setDate(j0End.getDate() + 1);

  const j7 = new Date(today);
  j7.setDate(j7.getDate() - 7);

  let rappels = 0;
  let prelevements = 0;
  let expires = 0;

  // J-15 rappels
  const aRappeler = await User.find({
    statut: 'actif',
    adhesionExpireAt: { $gte: j15, $lt: j15End },
  });
  for (const u of aRappeler) {
    await Notification.create({
      userId: u._id,
      type: 'adhesion_rappel',
      titre: 'Renouvellement dans 15 jours',
      corps: 'Votre adhésion BTB expire bientôt. Activez le renouvellement auto ou payez à l\'échéance.',
      lien: '/dashboard/adhesion',
    });
    await sendMail({
      to: u.email,
      subject: 'BTB — rappel renouvellement J-15',
      text: `Bonjour ${u.prenom}, votre adhésion expire le ${u.adhesionExpireAt?.toISOString()?.slice(0, 10)}.`,
      html: `<p>Rappel J-15 — <a href="${env.clientUrl}/dashboard/adhesion">Gérer mon adhésion</a></p>`,
    });
    await audit('adhesion.rappel_j15', { userId: u._id });
    rappels += 1;
  }

  // J-0
  const aEcheance = await User.find({
    statut: 'actif',
    adhesionExpireAt: { $gte: j0Start, $lt: j0End },
  });
  for (const u of aEcheance) {
    const montant = TARIFS_FCFA.adhesion[u.palier];
    if (montant == null) {
      await Notification.create({
        userId: u._id,
        type: 'adhesion_paiement',
        titre: 'Offre Business à renouveler',
        corps: 'Votre formule Business arrive à échéance. Un conseiller vous recontacte pour le devis.',
        lien: '/dashboard/adhesion',
      });
      await audit('adhesion.business_j0', { userId: u._id });
      continue;
    }
    if (u.renewalAuto && montant > 0) {
      await initierPaiement({
        userId: u._id,
        type: 'renouvellement',
        montant,
        meta: { palier: u.palier },
      });
      prelevements += 1;
      await audit('adhesion.prelevement_auto', { userId: u._id, montant });
    } else if (montant > 0) {
      await Notification.create({
        userId: u._id,
        type: 'adhesion_paiement',
        titre: 'Échéance adhésion',
        corps: 'Votre adhésion est due aujourd\'hui. Réglez pour rester visible.',
        lien: '/dashboard/adhesion',
      });
      await audit('adhesion.lien_paiement_j0', { userId: u._id });
    } else {
      u.adhesionExpireAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await u.save();
    }
  }

  // J+7 expiration
  const aExpirerAll = await User.find({
    statut: 'actif',
    adhesionExpireAt: { $lte: j7, $ne: null },
  });
  for (const u of aExpirerAll) {
    u.statut = 'expire';
    u.fichePubliee = false;
    await u.save();
    await Notification.create({
      userId: u._id,
      type: 'adhesion_expiree',
      titre: 'Adhésion expirée',
      corps: 'Votre fiche est masquée. Réactivez depuis le tableau de bord.',
      lien: '/dashboard/adhesion?reactiver=1',
    });
    await audit('adhesion.expiration_j7', { userId: u._id });
    expires += 1;
  }

  return { rappels, prelevements, expires };
}

export async function setRenewalAuto(userId, enabled) {
  const user = await User.findByIdAndUpdate(userId, { renewalAuto: !!enabled }, { new: true });
  await audit('adhesion.toggle_renewal', { userId, enabled: !!enabled });
  return user;
}

export async function historiquePaiements(userId) {
  return Paiement.find({ userId }).sort({ createdAt: -1 }).limit(50);
}
