import { Produit } from '../models/Produit.js';
import { Commande } from '../models/Commande.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/apiResponse.js';
import { peutBoutique } from '../config/droits.js';

const COMMANDE_TRANSITIONS = {
  demande_envoyee: ['prise_de_contact', 'annulee'],
  prise_de_contact: ['finalisee', 'annulee'],
  finalisee: [],
  en_attente_paiement: ['annulee'],
  payee: ['finalisee', 'annulee'],
  en_preparation: ['finalisee', 'annulee'],
  livree: [],
  annulee: [],
};

export function assertCommandeTransition(from, to) {
  if (!(COMMANDE_TRANSITIONS[from] || []).includes(to)) {
    throw new AppError(`Transition invalide : ${from} → ${to}`, {
      status: 422,
      code: 'INVALID_TRANSITION',
    });
  }
}

export async function catalogue({ q, categorie, page = 1, limit = 24 } = {}) {
  const filter = { actif: true };
  if (categorie) filter.categorie = categorie;
  if (q) filter.$text = { $search: q };

  const vendeurs = await User.find({
    statut: 'actif',
    palier: { $in: ['standard', 'premium', 'access', 'business'] },
  }).select('_id');
  filter.vendeurId = { $in: vendeurs.map((v) => v._id) };

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    Produit.find(filter)
      .populate('vendeurId', 'entreprise prenom nom slug ville label noteMoyenne palier logoUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Produit.countDocuments(filter),
  ]);

  return {
    data,
    pagination: { page: Number(page), limit: Number(limit), total, hasMore: skip + data.length < total },
  };
}

export async function mesProduits(vendeurId) {
  return Produit.find({ vendeurId }).sort({ updatedAt: -1 });
}

export async function upsertProduit(vendeur, payload, produitId) {
  if (!peutBoutique(vendeur.palier) || vendeur.statut !== 'actif') {
    throw new AppError('Marketplace réservée aux formules Standard et supérieures', {
      status: 403,
      code: 'FORBIDDEN',
    });
  }
  if (produitId) {
    const p = await Produit.findOne({ _id: produitId, vendeurId: vendeur._id });
    if (!p) throw new AppError('Produit introuvable', { status: 404, code: 'NOT_FOUND' });
    Object.assign(p, payload);
    await p.save();
    return p;
  }
  return Produit.create({ ...payload, vendeurId: vendeur._id });
}

export async function supprimerProduit(vendeurId, produitId) {
  const p = await Produit.findOneAndDelete({ _id: produitId, vendeurId });
  if (!p) throw new AppError('Produit introuvable', { status: 404, code: 'NOT_FOUND' });
  return p;
}

/**
 * Enregistre une demande de commande sans paiement ni commission.
 * Une demande distincte est créée par société afin de préserver la confidentialité.
 */
export async function creerCommande(acheteur, { lignes, adresseLivraison, message }) {
  if (!lignes?.length) throw new AppError('Panier vide', { status: 400, code: 'EMPTY_CART' });
  if (acheteur.statut !== 'actif') {
    throw new AppError('Compte actif requis', { status: 403, code: 'FORBIDDEN' });
  }
  if (acheteur.palier === 'decouverte') {
    throw new AppError('Les demandes Marketplace sont disponibles dès la formule Standard', {
      status: 403,
      code: 'STANDARD_REQUIRED',
    });
  }

  const groupes = new Map();
  for (const ligne of lignes) {
    const produit = await Produit.findOne({ _id: ligne.produitId, actif: true });
    if (!produit) {
      throw new AppError('Produit indisponible', { status: 404, code: 'PRODUCT_UNAVAILABLE' });
    }
    if (String(produit.vendeurId) === String(acheteur._id)) {
      throw new AppError('Vous ne pouvez pas commander votre propre produit', {
        status: 403,
        code: 'OWN_PRODUCT',
      });
    }
    const vendeurId = String(produit.vendeurId);
    const sousTotal = produit.prixUnitaire * ligne.quantite;
    const row = {
      produitId: produit._id,
      vendeurId: produit.vendeurId,
      nom: produit.nom,
      prixUnitaire: produit.prixUnitaire,
      quantite: ligne.quantite,
      sousTotal,
    };
    groupes.set(vendeurId, [...(groupes.get(vendeurId) || []), row]);
  }

  const commandes = [];
  for (const rows of groupes.values()) {
    const sousTotal = rows.reduce((sum, row) => sum + row.sousTotal, 0);
    commandes.push(
      await Commande.create({
        acheteurId: acheteur._id,
        lignes: rows,
        adresseLivraison,
        message,
        sousTotal,
        fraisService: 0,
        commissionTaux: 0,
        total: sousTotal,
        transactionHorsPlateforme: true,
        statut: 'demande_envoyee',
      })
    );
  }

  return {
    commandes,
    needsPayment: false,
    commissionTaux: 0,
    transactionHorsPlateforme: true,
  };
}

export async function mesCommandes(acheteurId) {
  return Commande.find({ acheteurId })
    .populate('lignes.vendeurId', 'entreprise prenom nom telephone email slug noteMoyenne')
    .sort({ createdAt: -1 });
}

export async function mesVentes(vendeurId) {
  return Commande.find({ 'lignes.vendeurId': vendeurId })
    .populate('acheteurId', 'entreprise prenom nom telephone email ville')
    .sort({ createdAt: -1 });
}

export async function transitionCommande(commandeId, user, to) {
  const commande = await Commande.findById(commandeId);
  if (!commande) throw new AppError('Commande introuvable', { status: 404, code: 'NOT_FOUND' });

  const isVendeur = commande.lignes.some((l) => String(l.vendeurId) === String(user._id));
  const isAcheteur = String(commande.acheteurId) === String(user._id);
  const isAdmin = ['admin', 'superadmin'].includes(user.role);

  if (to === 'prise_de_contact') {
    if (!isVendeur && !isAdmin) throw new AppError('Non autorisé', { status: 403, code: 'FORBIDDEN' });
  }
  if (to === 'finalisee' && !isAcheteur && !isAdmin) {
    throw new AppError('Seul l’acheteur peut clôturer cet échange', {
      status: 403,
      code: 'FORBIDDEN',
    });
  }
  if (to === 'annulee' && !isAcheteur && !isVendeur && !isAdmin) {
    throw new AppError('Non autorisé', { status: 403, code: 'FORBIDDEN' });
  }

  assertCommandeTransition(commande.statut, to);
  commande.statut = to;
  if (to === 'finalisee') commande.livreeAt = new Date();
  await commande.save();
  return commande;
}

export async function restituerStocksExpires() {
  // Les transactions sont conclues hors plateforme : aucun stock n'est réservé.
  return 0;
}
