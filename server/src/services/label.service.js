import { DossierLabel } from '../models/DossierLabel.js';
import { AppError } from '../utils/apiResponse.js';
import { TARIFS_FCFA } from '../config/constants.js';
import { initierPaiement } from './paiement.service.js';

/** Transitions autorisées (admin) */
export const DOSSIER_TRANSITIONS = {
  soumis: ['en_examen', 'rejete'],
  en_examen: ['pieces_manquantes', 'visite_programmee', 'valide', 'rejete'],
  pieces_manquantes: ['en_examen', 'rejete'],
  visite_programmee: ['valide', 'rejete', 'pieces_manquantes'],
  valide: [],
  rejete: [],
};

export function assertTransition(from, to) {
  const allowed = DOSSIER_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new AppError(`Transition invalide : ${from} → ${to}`, {
      status: 422,
      code: 'INVALID_TRANSITION',
    });
  }
}

export async function creerDossier(user, { niveauDemande, pieces = [] }) {
  if (user.statut !== 'actif') {
    throw new AppError('Compte actif requis', { status: 403, code: 'FORBIDDEN' });
  }
  const montant = TARIFS_FCFA.labellisation[niveauDemande];
  if (montant == null) {
    throw new AppError('Niveau de label invalide', { status: 400, code: 'VALIDATION_ERROR' });
  }

  const open = await DossierLabel.findOne({
    membreId: user._id,
    statut: { $nin: ['valide', 'rejete'] },
  });
  if (open) {
    throw new AppError('Un dossier est déjà en cours', { status: 409, code: 'DOSSIER_OPEN' });
  }

  // Statut provisoire avant paiement — le webhook met « soumis » visible admin
  const dossier = await DossierLabel.create({
    membreId: user._id,
    niveauDemande,
    pieces,
    statut: 'soumis',
    historique: [{ statut: 'soumis', note: 'Dossier créé — en attente de paiement audit' }],
  });

  const pay = await initierPaiement({
    userId: user._id,
    type: 'labellisation',
    montant,
    meta: { niveauLabel: niveauDemande, dossierLabelId: dossier._id },
  });

  dossier.paiementId = pay.paiement._id;
  await dossier.save();

  return {
    dossier,
    paiement: pay.paiement,
    checkoutUrl: pay.checkoutUrl,
    sandbox: pay.sandbox,
    montant,
  };
}

export async function getMonDossier(userId) {
  const dossier = await DossierLabel.findOne({ membreId: userId }).sort({ createdAt: -1 });
  return dossier;
}

export async function transitionDossier(dossierId, { to, motif, piecesManquantes, visiteAt, adminId }) {
  const dossier = await DossierLabel.findById(dossierId);
  if (!dossier) throw new AppError('Dossier introuvable', { status: 404, code: 'NOT_FOUND' });

  assertTransition(dossier.statut, to);

  dossier.statut = to;
  if (motif) dossier.motifRejet = motif;
  if (piecesManquantes) dossier.piecesManquantes = piecesManquantes;
  if (visiteAt) dossier.visiteAt = new Date(visiteAt);
  if (adminId) dossier.examinePar = adminId;

  if (to === 'valide') {
    dossier.valideAt = new Date();
    const User = (await import('../models/User.js')).User;
    const user = await User.findById(dossier.membreId);
    if (user) {
      user.label = {
        niveau: dossier.niveauDemande,
        obtenuAt: new Date(),
        expireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };
      await user.save();
    }
  }

  dossier.historique.push({
    statut: to,
    note: motif || piecesManquantes?.join(', ') || '',
    par: adminId,
  });
  await dossier.save();
  return dossier;
}
