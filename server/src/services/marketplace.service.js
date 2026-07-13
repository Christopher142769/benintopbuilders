import { Produit } from '../models/Produit.js';
import { Commande } from '../models/Commande.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/apiResponse.js';
import { TARIFS_FCFA } from '../config/constants.js';
import { initierPaiement } from './paiement.service.js';

const COMMANDE_TRANSITIONS = {
  en_attente_paiement: ['payee', 'annulee'],
  payee: ['en_preparation', 'annulee'],
  en_preparation: ['livree'],
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
  const filter = { actif: true, stock: { $gt: 0 } };
  if (categorie) filter.categorie = categorie;
  if (q) filter.$text = { $search: q };

  const vendeurs = await User.find({
    statut: 'actif',
    palier: 'fournisseur',
  }).select('_id');
  filter.vendeurId = { $in: vendeurs.map((v) => v._id) };

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    Produit.find(filter)
      .populate('vendeurId', 'entreprise slug ville label noteMoyenne')
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
  if (vendeur.palier !== 'fournisseur' || vendeur.statut !== 'actif') {
    throw new AppError('Boutique réservée au palier Fournisseur actif', {
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
 * Décrémente le stock atomiquement produit par produit.
 * Rollback compensatoire si un stock est insuffisant (sans transaction replica-set).
 */
export async function creerCommande(acheteur, { lignes, adresseLivraison }) {
  if (!lignes?.length) throw new AppError('Panier vide', { status: 400, code: 'EMPTY_CART' });

  const reserved = [];
  try {
    const lignesCalculees = [];
    let sousTotal = 0;

    for (const ligne of lignes) {
      const updated = await Produit.findOneAndUpdate(
        {
          _id: ligne.produitId,
          actif: true,
          stock: { $gte: ligne.quantite },
        },
        { $inc: { stock: -ligne.quantite } },
        { new: true }
      );
      if (!updated) {
        throw new AppError(`Stock insuffisant pour ${ligne.produitId}`, {
          status: 409,
          code: 'STOCK_INSUFFISANT',
        });
      }
      reserved.push({ produitId: updated._id, quantite: ligne.quantite });
      const prix = updated.prixUnitaire;
      const st = prix * ligne.quantite;
      sousTotal += st;
      lignesCalculees.push({
        produitId: updated._id,
        vendeurId: updated.vendeurId,
        nom: updated.nom,
        prixUnitaire: prix,
        quantite: ligne.quantite,
        sousTotal: st,
      });
    }

    const fraisService = Math.round(sousTotal * TARIFS_FCFA.commissionMarketplace);
    const total = sousTotal + fraisService;

    const commande = await Commande.create({
      acheteurId: acheteur._id,
      lignes: lignesCalculees,
      adresseLivraison,
      sousTotal,
      fraisService,
      total,
      statut: 'en_attente_paiement',
      stockReserveAt: new Date(),
    });

    const pay = await initierPaiement({
      userId: acheteur._id,
      type: 'commande',
      montant: total,
      meta: { commandeId: commande._id },
    });

    commande.paiementId = pay.paiement._id;
    await commande.save();

    return { commande, checkoutUrl: pay.checkoutUrl, sandbox: pay.sandbox, paiement: pay.paiement };
  } catch (err) {
    for (const r of reserved) {
      await Produit.updateOne({ _id: r.produitId }, { $inc: { stock: r.quantite } });
    }
    throw err;
  }
}

export async function mesCommandes(acheteurId) {
  return Commande.find({ acheteurId }).sort({ createdAt: -1 });
}

export async function mesVentes(vendeurId) {
  return Commande.find({ 'lignes.vendeurId': vendeurId, statut: { $ne: 'en_attente_paiement' } }).sort({
    createdAt: -1,
  });
}

export async function transitionCommande(commandeId, user, to) {
  const commande = await Commande.findById(commandeId);
  if (!commande) throw new AppError('Commande introuvable', { status: 404, code: 'NOT_FOUND' });

  const isVendeur = commande.lignes.some((l) => String(l.vendeurId) === String(user._id));
  const isAcheteur = String(commande.acheteurId) === String(user._id);
  const isAdmin = ['admin', 'superadmin'].includes(user.role);

  if (to === 'en_preparation' || to === 'livree') {
    if (!isVendeur && !isAdmin) throw new AppError('Non autorisé', { status: 403, code: 'FORBIDDEN' });
  }
  if (to === 'annulee' && !isAcheteur && !isVendeur && !isAdmin) {
    throw new AppError('Non autorisé', { status: 403, code: 'FORBIDDEN' });
  }

  assertCommandeTransition(commande.statut, to);
  commande.statut = to;
  if (to === 'livree') commande.livreeAt = new Date();
  await commande.save();
  return commande;
}

export async function restituerStocksExpires() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const commandes = await Commande.find({
    statut: 'en_attente_paiement',
    stockReserveAt: { $lte: cutoff },
  });

  let n = 0;
  for (const c of commandes) {
    for (const l of c.lignes) {
      await Produit.updateOne({ _id: l.produitId }, { $inc: { stock: l.quantite } });
    }
    c.statut = 'annulee';
    await c.save();
    n += 1;
  }
  return n;
}
