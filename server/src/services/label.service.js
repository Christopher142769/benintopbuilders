import { DossierLabel } from '../models/DossierLabel.js';
import { LabelFormulaire } from '../models/LabelFormulaire.js';
import { InscriptionFormation } from '../models/InscriptionFormation.js';
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

function normalizeValue(champ, raw) {
  if (champ.type === 'checkbox') return raw === true || raw === 'true' || raw === 'on';
  if (champ.type === 'number') {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new AppError(`${champ.label} doit être un nombre`, {
        status: 422,
        code: 'INVALID_FIELD',
      });
    }
    return value;
  }
  if (champ.type === 'multiselect') {
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [String(raw)];
    } catch {
      return String(raw)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
  }
  return raw == null ? '' : String(raw).trim();
}

export async function getFormulaire(niveau) {
  return LabelFormulaire.findOne({ niveau, actif: true })
    .populate('formationsRequises', 'titre description modalite dateDebut dureeHeures tarifMembre')
    .lean();
}

export async function creerDossier(
  user,
  { niveauDemande, pieces = [], valeurs = {}, fichiers = {} }
) {
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

  const formulaire = await LabelFormulaire.findOne({ niveau: niveauDemande, actif: true });
  if (!formulaire) {
    throw new AppError('Le formulaire de ce label n’est pas encore configuré', {
      status: 409,
      code: 'FORM_NOT_CONFIGURED',
    });
  }

  const reponses = formulaire.champs.map((champ) => {
    const file = fichiers[champ.key];
    const raw = valeurs[champ.key];
    if (champ.required && champ.type === 'file' && !file) {
      throw new AppError(`Le fichier « ${champ.label} » est obligatoire`, {
        status: 422,
        code: 'REQUIRED_FIELD',
      });
    }
    if (
      champ.required &&
      champ.type !== 'file' &&
      (raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0))
    ) {
      throw new AppError(`Le champ « ${champ.label} » est obligatoire`, {
        status: 422,
        code: 'REQUIRED_FIELD',
      });
    }
    return {
      champId: champ._id,
      key: champ.key,
      label: champ.label,
      type: champ.type,
      valeur: champ.type === 'file' ? undefined : normalizeValue(champ, raw),
      fichierUrl: file?.url,
      nomOriginal: file?.nomOriginal,
    };
  });

  const formationIds = formulaire.formationsRequises.map((id) => String(id));
  const completed = await InscriptionFormation.find({
    userId: user._id,
    formationId: { $in: formationIds },
    statut: 'presente',
  }).distinct('formationId');
  const completedIds = completed.map(String);
  const eligibleFormation = formationIds.every((id) => completedIds.includes(id));
  const fraisInclusAbonnement = user.palier !== 'decouverte';

  const dossier = await DossierLabel.create({
    membreId: user._id,
    niveauDemande,
    formulaireId: formulaire._id,
    formulaireVersion: formulaire.version,
    reponses,
    formationsRequises: formationIds,
    formationsValidees: completed,
    eligibleFormation,
    fraisInclusAbonnement,
    pieces,
    statut: 'soumis',
    historique: [
      {
        statut: 'soumis',
        note: fraisInclusAbonnement
          ? 'Dossier créé — frais inclus dans l’abonnement'
          : 'Dossier créé — en attente du paiement audit',
      },
    ],
  });

  if (fraisInclusAbonnement) {
    return {
      dossier,
      needsPayment: false,
      fraisInclusAbonnement: true,
      montant: 0,
      formationsManquantes: formationIds.filter((id) => !completedIds.includes(id)),
    };
  }

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
    needsPayment: true,
    fraisInclusAbonnement: false,
    montant,
    formationsManquantes: formationIds.filter((id) => !completedIds.includes(id)),
  };
}

export async function getMonDossier(userId) {
  const dossier = await DossierLabel.findOne({ membreId: userId })
    .populate('formationsRequises', 'titre description modalite dateDebut dureeHeures')
    .populate('formationsValidees', 'titre')
    .sort({ createdAt: -1 });
  if (dossier) {
    const completed = await InscriptionFormation.find({
      userId,
      formationId: { $in: dossier.formationsRequises.map((f) => f._id || f) },
      statut: 'presente',
    }).distinct('formationId');
    dossier.formationsValidees = completed;
    dossier.eligibleFormation = dossier.formationsRequises.every((f) =>
      completed.map(String).includes(String(f._id || f))
    );
    await dossier.save();
  }
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
    const completed = await InscriptionFormation.find({
      userId: dossier.membreId,
      formationId: { $in: dossier.formationsRequises },
      statut: 'presente',
    }).distinct('formationId');
    const allCompleted = dossier.formationsRequises.every((id) =>
      completed.map(String).includes(String(id))
    );
    if (!allCompleted) {
      throw new AppError('Les formations obligatoires doivent être validées avant le label', {
        status: 422,
        code: 'TRAINING_REQUIRED',
      });
    }
    dossier.formationsValidees = completed;
    dossier.eligibleFormation = true;
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
