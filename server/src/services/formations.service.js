import { Formation } from '../models/Formation.js';
import { InscriptionFormation } from '../models/InscriptionFormation.js';
import { Avis } from '../models/Avis.js';
import { AppelOffre } from '../models/AppelOffre.js';
import { Commande } from '../models/Commande.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/apiResponse.js';
import { initierPaiement } from './paiement.service.js';
import { sendMail } from './mail.service.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { uploadsRoot } from '../middlewares/upload.js';

export async function catalogueFormations() {
  return Formation.find({ active: true }).sort({ dateDebut: 1 });
}

export async function inscrireFormation(user, formationId, nbParticipants = 1) {
  const formation = await Formation.findById(formationId);
  if (!formation || !formation.active) {
    throw new AppError('Formation introuvable', { status: 404, code: 'NOT_FOUND' });
  }
  if (formation.placesRestantes < nbParticipants) {
    throw new AppError('Places insuffisantes', { status: 409, code: 'NO_PLACES' });
  }

  const existing = await InscriptionFormation.findOne({ formationId, userId: user._id });
  if (existing) {
    throw new AppError('Déjà inscrit', { status: 409, code: 'DUPLICATE' });
  }

  const membre = user.statut === 'actif' && user.role !== 'visiteur';
  const montant =
    (membre ? formation.tarifMembre : formation.tarifNonMembre) * nbParticipants;

  const inscription = await InscriptionFormation.create({
    formationId,
    userId: user._id,
    nbParticipants,
    montant,
    statut: 'en_attente_paiement',
  });

  if (montant === 0) {
    inscription.statut = 'confirmee';
    await inscription.save();
    formation.placesRestantes -= nbParticipants;
    await formation.save();
    return { inscription, needsPayment: false };
  }

  const pay = await initierPaiement({
    userId: user._id,
    type: 'formation',
    montant,
    meta: { formationId, inscriptionFormationId: inscription._id },
  });
  inscription.paiementId = pay.paiement._id;
  await inscription.save();
  return { inscription, needsPayment: true, checkoutUrl: pay.checkoutUrl, paiement: pay.paiement };
}

export async function emargement(inscriptionId, present = true) {
  const inscription = await InscriptionFormation.findById(inscriptionId).populate('formationId');
  if (!inscription) throw new AppError('Inscription introuvable', { status: 404, code: 'NOT_FOUND' });
  if (inscription.statut !== 'confirmee' && inscription.statut !== 'presente') {
    throw new AppError('Inscription non confirmée', { status: 422, code: 'INVALID_STATUS' });
  }
  inscription.statut = present ? 'presente' : 'absente';
  inscription.presenceValideeAt = new Date();
  await inscription.save();

  if (present) {
    const url = await genererAttestation(inscription);
    inscription.attestationUrl = url;
    await inscription.save();

    const formation = inscription.formationId;
    if (formation?.requiseLabelOr) {
      await User.findByIdAndUpdate(inscription.userId, {
        $push: {
          certifications: {
            titre: formation.titre,
            organisme: 'Bénin Top Builders',
            dateObtention: new Date(),
            formationId: formation._id,
          },
        },
      });
    }
  }
  return inscription;
}

async function genererAttestation(inscription) {
  const user = await User.findById(inscription.userId);
  const formation = await Formation.findById(inscription.formationId);
  const dir = path.join(uploadsRoot, 'attestations');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `attestation-${inscription._id}.pdf`;
  const abs = path.join(dir, filename);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(abs);
    doc.pipe(stream);
    doc.fontSize(22).text('Bénin Top Builders', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('Attestation de formation', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(12).text(
      `Je soussigné certifie que ${user.prenom} ${user.nom} a suivi la formation « ${formation.titre} » (${formation.dureeHeures} h).`
    );
    doc.moveDown();
    doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const url = `/uploads/attestations/${filename}`;
  await sendMail({
    to: user.email,
    subject: `Attestation — ${formation.titre}`,
    text: `Votre attestation est disponible : ${url}`,
    html: `<p>Votre attestation nominative est prête.</p>`,
  });
  return url;
}

export async function mesInscriptions(userId) {
  return InscriptionFormation.find({ userId }).populate('formationId').sort({ createdAt: -1 });
}

export async function creerAvis(auteur, { cibleId, note, commentaire, contexte }) {
  if (!contexte?.type || !contexte?.refId) {
    throw new AppError('Contexte avis requis', { status: 400, code: 'VALIDATION_ERROR' });
  }

  if (contexte.type === 'ao') {
    const ao = await AppelOffre.findById(contexte.refId);
    if (!ao || ao.statut !== 'attribue' || String(ao.auteurId) !== String(auteur._id)) {
      throw new AppError('Avis hors contexte AO retenu', { status: 403, code: 'FORBIDDEN' });
    }
    if (String(ao.attribueA) !== String(cibleId)) {
      throw new AppError('Cible avis incorrecte', { status: 403, code: 'FORBIDDEN' });
    }
  } else if (contexte.type === 'commande') {
    const cmd = await Commande.findById(contexte.refId);
    if (!cmd || cmd.statut !== 'livree' || String(cmd.acheteurId) !== String(auteur._id)) {
      throw new AppError('Avis hors contexte commande livrée', { status: 403, code: 'FORBIDDEN' });
    }
    const ok = cmd.lignes.some((l) => String(l.vendeurId) === String(cibleId));
    if (!ok) throw new AppError('Cible avis incorrecte', { status: 403, code: 'FORBIDDEN' });
  } else {
    throw new AppError('Type de contexte invalide', { status: 400, code: 'VALIDATION_ERROR' });
  }

  try {
    return await Avis.create({
      auteurId: auteur._id,
      cibleId,
      note,
      commentaire,
      contexte,
      statut: 'en_moderation',
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError('Avis déjà déposé pour ce contexte', { status: 409, code: 'DUPLICATE' });
    }
    throw err;
  }
}

export async function signalerAvis(avisId, userId, motif) {
  const avis = await Avis.findById(avisId);
  if (!avis) throw new AppError('Avis introuvable', { status: 404, code: 'NOT_FOUND' });
  avis.signalements.push({ par: userId, motif });
  avis.statut = 'signale';
  await avis.save();
  return avis;
}
