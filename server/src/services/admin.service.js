import { User } from '../models/User.js';
import { DossierLabel } from '../models/DossierLabel.js';
import { Avis } from '../models/Avis.js';
import { Produit } from '../models/Produit.js';
import { AppelOffre } from '../models/AppelOffre.js';
import { AuditLog } from '../models/AuditLog.js';
import { Paiement } from '../models/Paiement.js';
import { AppError } from '../utils/apiResponse.js';
import { transitionDossier } from './label.service.js';

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
  const [membresActifs, volume, inscriptions] = await Promise.all([
    User.countDocuments({ statut: 'actif', role: 'membre' }),
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
  ]);
  return {
    membresActifs,
    volumeFcfa30j: volume[0]?.total || 0,
    inscriptions12m: inscriptions,
  };
}

export async function listAudit({ limit = 100 } = {}) {
  return AuditLog.find().sort({ createdAt: -1 }).limit(Number(limit)).populate('acteurId', 'email prenom nom');
}
