import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectMongo, disconnectMongo } from '../config/db.js';
import { logger } from '../config/logger.js';
import {
  User,
  AppelOffre,
  Produit,
  Formation,
  Avis,
  Conversation,
  Message,
  Notification,
  Commande,
  Paiement,
  InscriptionFormation,
  DossierLabel,
  ReponseAO,
  AuditLog,
  Otp,
  LabelFormulaire,
} from '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Seed minimal : compte superadmin uniquement.
 * Annuaire, AO, matériaux et formations restent vides
 * jusqu’à création via le dashboard / admin.
 */
async function seed() {
  await connectMongo();
  logger.info('Seed — nettoyage (plateforme vide)');

  await Promise.all([
    User.deleteMany({}),
    AppelOffre.deleteMany({}),
    Produit.deleteMany({}),
    Formation.deleteMany({}),
    Avis.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    Commande.deleteMany({}),
    Paiement.deleteMany({}),
    InscriptionFormation.deleteMany({}),
    DossierLabel.deleteMany({}),
    ReponseAO.deleteMany({}),
    AuditLog.deleteMany({}),
    Otp.deleteMany({}),
    LabelFormulaire.deleteMany({}),
  ]);

  const adminHash = await bcrypt.hash(
    process.env.SEED_SUPERADMIN_PASSWORD || 'ChangeMeSuperAdmin1!',
    10
  );

  const superadmin = await User.create({
    email: process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@benintopbuilders.bj',
    passwordHash: adminHash,
    role: 'superadmin',
    statut: 'actif',
    prenom: 'Super',
    nom: 'Admin',
    profilType: 'entreprise_btp',
    palier: 'premium',
    emailVerifieAt: new Date(),
    charteAccepteeAt: new Date(),
    adhesionExpireAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    fichePubliee: false,
  });

  await LabelFormulaire.insertMany(
    [
      {
        niveau: 'bronze',
        titre: 'Dossier de labellisation Bronze',
        description: 'Vérification de l’identité, de la conformité et des premières références.',
        champs: [
          { key: 'ifu', label: 'Numéro IFU', type: 'text', required: true, ordre: 1 },
          { key: 'rccm', label: 'Extrait RCCM', type: 'file', required: true, ordre: 2 },
          {
            key: 'experience',
            label: 'Années d’expérience',
            type: 'number',
            required: true,
            ordre: 3,
          },
          {
            key: 'references',
            label: 'Références de chantiers',
            type: 'textarea',
            required: true,
            ordre: 4,
          },
        ],
      },
      {
        niveau: 'argent',
        titre: 'Dossier de labellisation Argent',
        description: 'Conformité renforcée, assurance et références vérifiables.',
        champs: [
          { key: 'rccm', label: 'Extrait RCCM', type: 'file', required: true, ordre: 1 },
          { key: 'cnss', label: 'Attestation CNSS', type: 'file', required: true, ordre: 2 },
          {
            key: 'assurance',
            label: 'Assurance responsabilité professionnelle',
            type: 'file',
            required: true,
            ordre: 3,
          },
          {
            key: 'references',
            label: 'Trois références détaillées',
            type: 'textarea',
            required: true,
            ordre: 4,
          },
        ],
      },
      {
        niveau: 'or',
        titre: 'Dossier de labellisation Or',
        description: 'Excellence opérationnelle, conformité complète et formation requise.',
        champs: [
          {
            key: 'certifications',
            label: 'Certifications professionnelles',
            type: 'file',
            required: true,
            ordre: 1,
          },
          {
            key: 'qualite',
            label: 'Dispositif qualité et sécurité',
            type: 'textarea',
            required: true,
            ordre: 2,
          },
          {
            key: 'realisations',
            label: 'Portfolio de réalisations majeures',
            type: 'file',
            required: true,
            ordre: 3,
          },
        ],
      },
    ].map((form) => ({ ...form, creePar: superadmin._id, modifiePar: superadmin._id }))
  );

  logger.info(
    {
      superadmin: superadmin.email,
      membres: 0,
      aos: 0,
      produits: 0,
      formations: 0,
    },
    'Seed terminé — sections publiques vides'
  );

  await disconnectMongo();
}

seed().catch(async (err) => {
  logger.error({ err }, 'Seed échoué');
  await disconnectMongo().catch(() => {});
  process.exit(1);
});
