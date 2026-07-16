import { User } from '../models/User.js';
import { DossierLabel } from '../models/DossierLabel.js';
import { Avis } from '../models/Avis.js';
import { Produit } from '../models/Produit.js';
import { AppelOffre } from '../models/AppelOffre.js';
import { AuditLog } from '../models/AuditLog.js';
import { Paiement } from '../models/Paiement.js';
import { LabelFormulaire } from '../models/LabelFormulaire.js';
import { ReponseAO } from '../models/ReponseAO.js';
import { Commande } from '../models/Commande.js';
import { Formation } from '../models/Formation.js';
import { ProgressionFormation } from '../models/ProgressionFormation.js';
import { ActivityEvent } from '../models/ActivityEvent.js';
import { AppError } from '../utils/apiResponse.js';
import { transitionDossier } from './label.service.js';
import { sendMail } from './mail.service.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';

async function audit(acteurId, action, ressource, ressourceId, details) {
  await AuditLog.create({ acteurId, action, ressource, ressourceId, details });
}

export async function listDossiers(statut) {
  const filter = statut ? { statut } : {};
  return DossierLabel.find(filter).populate('membreId', 'entreprise email prenom nom slug').sort({ createdAt: -1 });
}

export async function transitionDossierAdmin(admin, dossierId, payload) {
  const dossier = await transitionDossier(dossierId, { ...payload, adminId: admin._id });
  await audit(admin._id, `dossier.${payload.to}`, 'DossierLabel', dossierId, payload);
  return dossier;
}

export async function listLabelFormulaires() {
  return LabelFormulaire.find()
    .populate('formationsRequises', 'titre modalite dateDebut active')
    .sort({ niveau: 1 });
}

export async function createLabelFormulaire(admin, payload) {
  try {
    const form = await LabelFormulaire.create({
      ...payload,
      creePar: admin._id,
      modifiePar: admin._id,
    });
    await audit(admin._id, 'label_formulaire.cree', 'LabelFormulaire', form._id, {
      niveau: form.niveau,
    });
    return form;
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError('Un formulaire existe déjà pour ce niveau', {
        status: 409,
        code: 'DUPLICATE',
      });
    }
    throw err;
  }
}

export async function updateLabelFormulaire(admin, id, payload) {
  const current = await LabelFormulaire.findById(id);
  if (!current) {
    throw new AppError('Formulaire introuvable', { status: 404, code: 'NOT_FOUND' });
  }
  Object.assign(current, payload);
  current.version += 1;
  current.modifiePar = admin._id;
  await current.save();
  await audit(admin._id, 'label_formulaire.modifie', 'LabelFormulaire', id, {
    niveau: current.niveau,
    version: current.version,
  });
  return current;
}

export async function deleteLabelFormulaire(admin, id) {
  const form = await LabelFormulaire.findByIdAndDelete(id);
  if (!form) {
    throw new AppError('Formulaire introuvable', { status: 404, code: 'NOT_FOUND' });
  }
  await audit(admin._id, 'label_formulaire.supprime', 'LabelFormulaire', id, {
    niveau: form.niveau,
  });
  return form;
}

export async function listMembres({ q, statut } = {}) {
  const filter = { role: { $in: ['membre', 'visiteur'] } };
  if (statut) filter.statut = statut;
  if (q) filter.$text = { $search: q };
  return User.find(filter).sort({ createdAt: -1 }).limit(100);
}

export async function suspendreMembre(admin, membreId, motif) {
  const user = await User.findById(membreId);
  if (!user) throw new AppError('Membre introuvable', { status: 404, code: 'NOT_FOUND' });
  user.statut = 'suspendu';
  user.suspenduMotif = motif;
  user.suspenduAt = new Date();
  user.fichePubliee = false;
  await user.save();
  await audit(admin._id, 'membre.suspendu', 'User', membreId, { motif });
  return user;
}

export async function reactiverMembre(admin, membreId) {
  const user = await User.findById(membreId);
  if (!user) throw new AppError('Membre introuvable', { status: 404, code: 'NOT_FOUND' });
  user.statut = 'actif';
  user.suspenduMotif = undefined;
  user.suspenduAt = undefined;
  await user.save();
  await audit(admin._id, 'membre.reactive', 'User', membreId, {});
  return user;
}

export async function listFormateurs() {
  return User.find({ role: 'formateur' })
    .select('-passwordHash -refreshTokenHash')
    .sort({ createdAt: -1 });
}

export async function createFormateur(admin, payload) {
  const exists = await User.exists({ email: payload.email.toLowerCase() });
  if (exists) {
    throw new AppError('Cette adresse e-mail est déjà utilisée', {
      status: 409,
      code: 'DUPLICATE',
    });
  }
  const temporaryPassword =
    payload.password || `BTB-${crypto.randomBytes(6).toString('base64url')}!7`;
  const user = await User.create({
    email: payload.email.toLowerCase(),
    passwordHash: await bcrypt.hash(temporaryPassword, 10),
    role: 'formateur',
    statut: 'actif',
    prenom: payload.prenom,
    nom: payload.nom,
    telephone: payload.telephone,
    formateur: {
      niveauxLabels: payload.niveauxLabels,
      specialite: payload.specialite,
      bio: payload.bio,
      actif: true,
    },
    emailVerifieAt: new Date(),
  });
  await audit(admin._id, 'formateur.cree', 'User', user._id, {
    niveauxLabels: payload.niveauxLabels,
  });
  await sendMail({
    to: user.email,
    subject: 'Votre accès formateur Bénin Top Builders',
    text: `Votre compte formateur est prêt. Connexion : /formateur/connexion — Mot de passe temporaire : ${temporaryPassword}`,
    html: `<p>Votre compte formateur est prêt.</p><p>Mot de passe temporaire : <strong>${temporaryPassword}</strong></p>`,
  });
  return { formateur: user.toJSON(), temporaryPassword };
}

export async function updateFormateur(admin, id, payload) {
  const user = await User.findOne({ _id: id, role: 'formateur' });
  if (!user) {
    throw new AppError('Formateur introuvable', { status: 404, code: 'NOT_FOUND' });
  }
  for (const key of ['prenom', 'nom', 'telephone']) {
    if (payload[key] !== undefined) user[key] = payload[key];
  }
  if (payload.niveauxLabels) user.formateur.niveauxLabels = payload.niveauxLabels;
  if (payload.specialite !== undefined) user.formateur.specialite = payload.specialite;
  if (payload.bio !== undefined) user.formateur.bio = payload.bio;
  if (payload.actif !== undefined) {
    user.formateur.actif = payload.actif;
    user.statut = payload.actif ? 'actif' : 'suspendu';
  }
  await user.save();
  await audit(admin._id, 'formateur.modifie', 'User', user._id, payload);
  return user;
}

export async function moderationAvis() {
  return Avis.find({ statut: { $in: ['en_moderation', 'signale'] } })
    .populate('auteurId', 'prenom nom')
    .populate('cibleId', 'entreprise')
    .sort({ createdAt: -1 });
}

export async function publierAvis(admin, avisId, publier = true) {
  const avis = await Avis.findById(avisId);
  if (!avis) throw new AppError('Avis introuvable', { status: 404, code: 'NOT_FOUND' });
  avis.statut = publier ? 'publie' : 'rejete';
  await avis.save();
  await audit(admin._id, publier ? 'avis.publie' : 'avis.rejete', 'Avis', avisId, {});
  return avis;
}

export async function prixAnormaux() {
  const cats = await Produit.aggregate([
    { $match: { actif: true } },
    { $group: { _id: '$categorie', prices: { $push: '$prixUnitaire' } } },
  ]);
  const outliers = [];
  for (const g of cats) {
    const sorted = [...g.prices].sort((a, b) => a - b);
    const mid = sorted[Math.floor(sorted.length / 2)] || 0;
    const threshold = mid * 0.3;
    const prods = await Produit.find({
      categorie: g._id,
      actif: true,
      prixUnitaire: { $lt: threshold },
    }).populate('vendeurId', 'entreprise');
    outliers.push(...prods.map((p) => ({ ...p.toJSON(), mediane: mid })));
  }
  return outliers;
}

export async function aoDoublons() {
  return AppelOffre.aggregate([
    { $match: { statut: 'ouvert' } },
    {
      $group: {
        _id: { titre: '$titre', auteurId: '$auteurId' },
        count: { $sum: 1 },
        ids: { $push: '$_id' },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);
}

export async function statsOverview() {
  const depuis30j = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const depuis7j = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [
    membresActifs,
    membresTotal,
    nouveaux30j,
    actifs7j,
    volume,
    inscriptions,
    affluence,
    paliers,
    offres,
    reponses,
    demandes,
    formations,
    progressions,
    dossiersAttente,
    avisAttente,
  ] = await Promise.all([
    User.countDocuments({ statut: 'actif', role: 'membre' }),
    User.countDocuments({ role: { $in: ['membre', 'visiteur'] } }),
    User.countDocuments({
      role: { $in: ['membre', 'visiteur'] },
      createdAt: { $gte: depuis30j },
    }),
    User.countDocuments({ role: 'membre', lastActiveAt: { $gte: depuis7j } }),
    Paiement.aggregate([
      { $match: { statut: 'reussi', payeAt: { $gte: depuis30j } } },
      { $group: { _id: null, total: { $sum: '$montant' } } },
    ]),
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    ActivityEvent.aggregate([
      { $match: { day: { $gte: firstDay, $lte: today } } },
      {
        $group: {
          _id: '$day',
          utilisateurs: { $addToSet: '$userId' },
          requetes: { $sum: '$requests' },
        },
      },
      {
        $project: {
          _id: 1,
          visiteursUniques: { $size: '$utilisateurs' },
          requetes: 1,
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { role: { $in: ['membre', 'visiteur'] } } },
      { $group: { _id: '$palier', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AppelOffre.countDocuments(),
    ReponseAO.countDocuments(),
    Commande.countDocuments(),
    Formation.countDocuments({ statutPublication: 'publie', active: true }),
    ProgressionFormation.aggregate([
      { $group: { _id: '$statut', count: { $sum: 1 } } },
    ]),
    DossierLabel.countDocuments({
      statut: { $in: ['soumis', 'en_examen', 'pieces_manquantes', 'visite_programmee'] },
    }),
    Avis.countDocuments({ statut: { $in: ['en_moderation', 'signale'] } }),
  ]);

  const dailyMap = new Map(affluence.map((point) => [point._id, point]));
  const affluence30j = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    return dailyMap.get(date) || { _id: date, visiteursUniques: 0, requetes: 0 };
  });
  const databaseOk = mongoose.connection.readyState === 1;
  const backlog = dossiersAttente + avisAttente;
  const healthScore = Math.max(
    0,
    Math.min(100, (databaseOk ? 60 : 0) + (backlog < 10 ? 25 : backlog < 30 ? 15 : 5) + 15)
  );
  return {
    membresActifs,
    membresTotal,
    nouveaux30j,
    actifs7j,
    volumeFcfa30j: volume[0]?.total || 0,
    inscriptions12m: inscriptions,
    affluence30j,
    repartitionPaliers: paliers,
    activite: {
      offres,
      reponses,
      demandesMarketplace: demandes,
      formationsPubliees: formations,
    },
    apprentissage: progressions,
    moderation: { dossiersAttente, avisAttente },
    sante: {
      score: healthScore,
      statut: healthScore >= 85 ? 'Excellente' : healthScore >= 70 ? 'Stable' : 'À surveiller',
      database: databaseOk ? 'opérationnelle' : 'indisponible',
      api: 'opérationnelle',
      uptimeSecondes: Math.round(process.uptime()),
      backlog,
      mesureDepuis: affluence30j.find((point) => point.requetes > 0)?._id || null,
    },
  };
}

export async function listAudit({ limit = 100 } = {}) {
  return AuditLog.find().sort({ createdAt: -1 }).limit(Number(limit)).populate('acteurId', 'email prenom nom');
}
