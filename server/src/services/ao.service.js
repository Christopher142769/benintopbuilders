import { AppelOffre } from '../models/AppelOffre.js';
import { ReponseAO } from '../models/ReponseAO.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AppError } from '../utils/apiResponse.js';

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function monthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function hoursUntil(date) {
  return (new Date(date).getTime() - Date.now()) / (60 * 60 * 1000);
}

async function notify(userId, { type, titre, message, lien, meta }) {
  await Notification.create({ userId, type, titre, corps: message, lien, meta });
}

export async function createAO(auteur, payload) {
  if (auteur.statut !== 'actif') {
    throw new AppError('Compte actif requis', { status: 403, code: 'FORBIDDEN' });
  }
  if (auteur.palier === 'decouverte') {
    throw new AppError('La publication d’appels d’offres est disponible dès la formule Standard', {
      status: 403,
      code: 'STANDARD_REQUIRED',
    });
  }
  const publishedAt = new Date();
  const ao = await AppelOffre.create({
    ...payload,
    auteurId: auteur._id,
    publishedAt,
    visiblePremiumAvant: publishedAt, // premium immédiat ; non-premium +24h
    statut: 'ouvert',
  });

  // Alertes membres (hors auteur)
  const membres = await User.find({
    statut: 'actif',
    role: 'membre',
    _id: { $ne: auteur._id },
    $or: [{ metiers: payload.categorie }, { departement: payload.departement }],
  }).select('_id palier');

  await Promise.all(
    membres.map((m) =>
      notify(m._id, {
        type: 'ao_nouveau',
        titre: 'Nouvel appel d\'offres',
        message: ao.titre,
        lien: `/appels-offres?id=${ao._id}`,
        meta: { aoId: ao._id },
      })
    )
  );

  return ao;
}

export async function listAO(viewer, query = {}) {
  const filter = {};
  if (query.statut) filter.statut = query.statut;
  else filter.statut = { $in: ['ouvert', 'clos', 'attribue'] };
  if (query.categorie) filter.categorie = query.categorie;
  if (query.departement) filter.departement = query.departement;

  const now = new Date();
  const isPremium = viewer?.palier === 'premium' && viewer?.statut === 'actif';

  let rows = await AppelOffre.find(filter).sort({ createdAt: -1 }).lean();

  // Règle visibilité Premium 24 h : non-premium ne voit l'AO que 24 h après publication
  if (!isPremium) {
    rows = rows.filter((ao) => {
      if (viewer && String(ao.auteurId) === String(viewer._id)) return true;
      if (['admin', 'superadmin'].includes(viewer?.role)) return true;
      const unlock = addHours(new Date(ao.publishedAt || ao.createdAt), 24);
      return now >= unlock;
    });
  }

  return rows.map((ao) => ({
    ...ao,
    clotureBientot: hoursUntil(ao.dateCloture) < 72 && ao.statut === 'ouvert',
  }));
}

export async function getAO(id) {
  const ao = await AppelOffre.findById(id);
  if (!ao) throw new AppError('AO introuvable', { status: 404, code: 'NOT_FOUND' });
  return ao;
}

export async function updateAO(aoId, auteurId, payload) {
  const ao = await AppelOffre.findById(aoId);
  if (!ao) throw new AppError('AO introuvable', { status: 404, code: 'NOT_FOUND' });
  if (String(ao.auteurId) !== String(auteurId)) {
    throw new AppError('Non autorisé', { status: 403, code: 'FORBIDDEN' });
  }
  if (ao.nbReponses >= 3) {
    throw new AppError('AO non modifiable (≥ 3 réponses)', { status: 422, code: 'AO_LOCKED' });
  }
  if (ao.statut !== 'ouvert') {
    throw new AppError('AO non ouvert', { status: 422, code: 'INVALID_STATUS' });
  }
  Object.assign(ao, payload);
  await ao.save();
  return ao;
}

export async function deposerReponse(membre, aoId, payload) {
  if (membre.statut !== 'actif' || membre.role === 'visiteur') {
    throw new AppError('Membre actif requis', { status: 403, code: 'FORBIDDEN' });
  }

  const ao = await AppelOffre.findById(aoId);
  if (!ao || ao.statut !== 'ouvert') {
    throw new AppError('AO non ouvert', { status: 422, code: 'AO_CLOSED' });
  }
  if (new Date() > new Date(ao.dateCloture)) {
    throw new AppError('AO clôturé', { status: 422, code: 'AO_CLOSED' });
  }
  if (String(ao.auteurId) === String(membre._id)) {
    throw new AppError('Vous ne pouvez pas répondre à votre AO', { status: 403, code: 'FORBIDDEN' });
  }

  // Visibilité premium 24h
  if (membre.palier !== 'premium') {
    const unlock = addHours(new Date(ao.publishedAt || ao.createdAt), 24);
    if (new Date() < unlock) {
      throw new AppError('AO réservé Premium pendant 24 h', {
        status: 403,
        code: 'PREMIUM_ONLY',
      });
    }
  }

  // Quota Découverte 2/mois
  if (membre.palier === 'decouverte') {
    const key = monthKey();
    if (membre.reponsesAoMoisCle !== key) {
      membre.reponsesAoMoisCle = key;
      membre.reponsesAoCeMois = 0;
    }
    if (membre.reponsesAoCeMois >= 2) {
      throw new AppError('Quota de 2 réponses/mois atteint — passez Standard ou Premium', {
        status: 403,
        code: 'QUOTA_ATTEINT',
      });
    }
  }

  try {
    const reponse = await ReponseAO.create({
      aoId,
      membreId: membre._id,
      ...payload,
      statut: 'recue',
    });
    ao.nbReponses += 1;
    await ao.save();

    if (membre.palier === 'decouverte') {
      membre.reponsesAoCeMois += 1;
      await membre.save();
    }

    await notify(ao.auteurId, {
      type: 'ao_reponse',
      titre: 'Nouvelle réponse à votre AO',
      message: ao.titre,
      lien: `/dashboard/mes-ao`,
      meta: { aoId, reponseId: reponse._id },
    });

    return reponse;
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError('Vous avez déjà répondu à cet AO', { status: 409, code: 'DUPLICATE_RESPONSE' });
    }
    throw err;
  }
}

export async function listReponsesForAO(aoId, auteurId) {
  const ao = await AppelOffre.findById(aoId);
  if (!ao) throw new AppError('AO introuvable', { status: 404, code: 'NOT_FOUND' });
  if (String(ao.auteurId) !== String(auteurId)) {
    throw new AppError('Non autorisé', { status: 403, code: 'FORBIDDEN' });
  }
  return ReponseAO.find({ aoId }).populate('membreId', 'entreprise prenom nom slug label noteMoyenne palier');
}

export async function mesReponses(membreId) {
  return ReponseAO.find({ membreId }).populate('aoId', 'titre statut dateCloture ville').sort({ createdAt: -1 });
}

export async function mesAO(auteurId) {
  return AppelOffre.find({ auteurId }).sort({ createdAt: -1 });
}

export async function updateReponseStatut(auteurId, reponseId, statut) {
  const reponse = await ReponseAO.findById(reponseId);
  if (!reponse) throw new AppError('Réponse introuvable', { status: 404, code: 'NOT_FOUND' });

  const ao = await AppelOffre.findById(reponse.aoId);
  if (!ao || String(ao.auteurId) !== String(auteurId)) {
    throw new AppError('Non autorisé', { status: 403, code: 'FORBIDDEN' });
  }

  if (!['en_etude', 'retenue', 'non_retenue'].includes(statut)) {
    throw new AppError('Statut invalide', { status: 422, code: 'INVALID_STATUS' });
  }

  if (statut === 'retenue') {
    reponse.statut = 'retenue';
    await reponse.save();
    await ReponseAO.updateMany(
      { aoId: ao._id, _id: { $ne: reponse._id } },
      { $set: { statut: 'non_retenue' } }
    );
    ao.statut = 'attribue';
    ao.attribueA = reponse.membreId;
    ao.reponseRetenueId = reponse._id;
    await ao.save();

    await notify(reponse.membreId, {
      type: 'ao_retenue',
      titre: 'Votre offre a été retenue',
      message: ao.titre,
      lien: `/dashboard?msg=ao&aoId=${ao._id}`,
      meta: { aoId: ao._id },
    });

    const others = await ReponseAO.find({ aoId: ao._id, _id: { $ne: reponse._id } });
    await Promise.all(
      others.map((r) =>
        notify(r.membreId, {
          type: 'ao_non_retenue',
          titre: 'Offre non retenue',
          message: ao.titre,
          lien: '/dashboard/mes-reponses',
          meta: { aoId: ao._id },
        })
      )
    );
  } else {
    reponse.statut = statut;
    await reponse.save();
  }

  return reponse;
}

export async function cloturerExpires() {
  const now = new Date();
  const result = await AppelOffre.updateMany(
    { statut: 'ouvert', dateCloture: { $lte: now } },
    { $set: { statut: 'clos' } }
  );
  return result.modifiedCount;
}

export async function resetQuotasMensuels() {
  const key = monthKey();
  const result = await User.updateMany(
    { reponsesAoMoisCle: { $ne: key } },
    { $set: { reponsesAoCeMois: 0, reponsesAoMoisCle: key } }
  );
  return result.modifiedCount;
}
