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
} from '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const cities = [
  { ville: 'Cotonou', departement: 'Littoral', coords: [2.4253, 6.3703] },
  { ville: 'Abomey-Calavi', departement: 'Atlantique', coords: [2.3533, 6.4489] },
  { ville: 'Porto-Novo', departement: 'Ouémé', coords: [2.6036, 6.4969] },
  { ville: 'Ouidah', departement: 'Atlantique', coords: [2.0851, 6.3631] },
  { ville: 'Bohicon', departement: 'Zou', coords: [2.0667, 7.1783] },
];

const membresSeed = [
  { prenom: 'Kofi', nom: 'Adjado', entreprise: 'Solid Bât SA', profilType: 'entreprise_btp', palier: 'premium', metiers: ['maconnerie', 'charpente'], label: 'or', city: 0 },
  { prenom: 'Amina', nom: 'Soule', entreprise: 'Électro Plus', profilType: 'entreprise_btp', palier: 'standard', metiers: ['electricite'], label: 'argent', city: 1 },
  { prenom: 'Jean', nom: 'Houngbo', entreprise: 'PlombExpert', profilType: 'artisan', palier: 'standard', metiers: ['plomberie'], label: 'bronze', city: 0 },
  { prenom: 'Fatou', nom: 'Dossou', entreprise: 'Carrelage Prestige', profilType: 'artisan', palier: 'decouverte', metiers: ['carrelage'], label: null, city: 2 },
  { prenom: 'Marc', nom: 'Zinsou', entreprise: 'Bois & Style', profilType: 'artisan', palier: 'standard', metiers: ['menuiserie'], label: 'bronze', city: 3 },
  { prenom: 'Sophie', nom: 'Agossou', entreprise: 'Peinture Pro BJ', profilType: 'prestataire', palier: 'premium', metiers: ['peinture'], label: 'argent', city: 1 },
  { prenom: 'Ibrahim', nom: 'Bio', entreprise: 'Topo Bénin', profilType: 'prestataire', palier: 'standard', metiers: ['topographie', 'bureau_etudes'], label: 'bronze', city: 2 },
  { prenom: 'Claire', nom: 'Hounkanrin', entreprise: 'Matériaux du Golfe', profilType: 'fournisseur', palier: 'fournisseur', metiers: ['fourniture_materiaux'], label: 'argent', city: 0 },
  { prenom: 'Paul', nom: 'Tossavi', entreprise: 'Quincaillerie Atlantique', profilType: 'fournisseur', palier: 'fournisseur', metiers: ['fourniture_materiaux'], label: 'bronze', city: 1 },
  { prenom: 'Nadia', nom: 'Guezodje', entreprise: 'Horizon Immo', profilType: 'maitre_ouvrage', palier: 'decouverte', metiers: [], label: null, city: 4 },
  { prenom: 'Eric', nom: 'Akplogan', entreprise: 'Béton Armé Express', profilType: 'entreprise_btp', palier: 'premium', metiers: ['maconnerie'], label: 'or', city: 4 },
  { prenom: 'Rachel', nom: 'Ayé', entreprise: 'Toiture Secure', profilType: 'artisan', palier: 'standard', metiers: ['charpente'], label: null, city: 3 },
];

async function seed() {
  await connectMongo();
  logger.info('Seed — nettoyage des collections');

  await Promise.all([
    User.deleteMany({}),
    AppelOffre.deleteMany({}),
    Produit.deleteMany({}),
    Formation.deleteMany({}),
    Avis.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('Password123!', 10);
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
  });

  const membres = [];
  for (const m of membresSeed) {
    const city = cities[m.city];
    const entreprise = m.entreprise;
    const user = await User.create({
      email: `${slugify(m.prenom)}.${slugify(m.nom)}@demo.btb.bj`,
      passwordHash,
      role: 'membre',
      statut: 'actif',
      profilType: m.profilType,
      palier: m.palier,
      prenom: m.prenom,
      nom: m.nom,
      telephone: `+22901${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`,
      entreprise,
      ifu: `IFU${Math.floor(10000000 + Math.random() * 89999999)}`,
      rccm: `RB/COT/${Math.floor(1000 + Math.random() * 8999)}`,
      departement: city.departement,
      ville: city.ville,
      zonesIntervention: [city.ville, cities[(m.city + 1) % cities.length].ville],
      presentation: `${entreprise} — professionnel du BTP basé à ${city.ville}.`,
      metiers: m.metiers,
      disponible: true,
      localisation: { type: 'Point', coordinates: city.coords },
      slug: slugify(entreprise),
      fichePubliee: m.profilType !== 'maitre_ouvrage',
      label: m.label
        ? {
            niveau: m.label,
            obtenuAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
            expireAt: new Date(Date.now() + 335 * 24 * 3600 * 1000),
          }
        : { niveau: null },
      noteMoyenne: 0,
      nbAvis: 0,
      emailVerifieAt: new Date(),
      charteAccepteeAt: new Date(),
      adhesionExpireAt: new Date(Date.now() + 200 * 24 * 3600 * 1000),
      references: [
        {
          titre: `Chantier ${city.ville}`,
          description: 'Réalisation type seed',
          lieu: city.ville,
          annee: 2025,
          photos: [],
        },
      ],
    });
    membres.push(user);
  }

  const pros = membres.filter((u) => u.fichePubliee);
  const client = membres.find((u) => u.profilType === 'maitre_ouvrage') || membres[9];

  const aos = await AppelOffre.insertMany([
    {
      auteurId: client._id,
      titre: 'Construction villa R+1 — Abomey-Calavi',
      description: 'Gros œuvre et second œuvre pour villa familiale.',
      categorie: 'maconnerie',
      departement: 'Atlantique',
      ville: 'Abomey-Calavi',
      budgetMin: 25000000,
      budgetMax: 40000000,
      dateCloture: new Date(Date.now() + 12 * 24 * 3600 * 1000),
      publishedAt: new Date(),
      visiblePremiumAvant: new Date(),
      localisation: { type: 'Point', coordinates: [2.3533, 6.4489] },
    },
    {
      auteurId: client._id,
      titre: 'Réfection électrique immeuble — Cotonou',
      description: 'Mise aux normes du réseau électrique.',
      categorie: 'electricite',
      departement: 'Littoral',
      ville: 'Cotonou',
      surDevis: true,
      dateCloture: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      publishedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      localisation: { type: 'Point', coordinates: [2.4253, 6.3703] },
    },
    {
      auteurId: client._id,
      titre: 'Pose carrelage salle de bain — Porto-Novo',
      description: 'Fourniture et pose ~80 m².',
      categorie: 'carrelage',
      departement: 'Ouémé',
      ville: 'Porto-Novo',
      budgetMin: 1500000,
      budgetMax: 2800000,
      dateCloture: new Date(Date.now() + 8 * 24 * 3600 * 1000),
      localisation: { type: 'Point', coordinates: [2.6036, 6.4969] },
    },
    {
      auteurId: client._id,
      titre: 'Charpente et couverture — Ouidah',
      description: 'Charpente bois et tôles bac.',
      categorie: 'charpente',
      departement: 'Atlantique',
      ville: 'Ouidah',
      surDevis: true,
      dateCloture: new Date(Date.now() + 15 * 24 * 3600 * 1000),
      localisation: { type: 'Point', coordinates: [2.0851, 6.3631] },
    },
    {
      auteurId: client._id,
      titre: 'Étude topographique lotissement — Bohicon',
      description: 'Levés topographiques et plans.',
      categorie: 'topographie',
      departement: 'Zou',
      ville: 'Bohicon',
      budgetMin: 800000,
      budgetMax: 1500000,
      dateCloture: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      localisation: { type: 'Point', coordinates: [2.0667, 7.1783] },
    },
    {
      auteurId: client._id,
      titre: 'Peinture intérieure bureaux — Cotonou',
      description: 'Peinture et finitions ~400 m².',
      categorie: 'peinture',
      departement: 'Littoral',
      ville: 'Cotonou',
      budgetMin: 1200000,
      budgetMax: 2200000,
      dateCloture: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      localisation: { type: 'Point', coordinates: [2.4253, 6.3703] },
    },
  ]);

  const fournisseurs = membres.filter((u) => u.palier === 'fournisseur');
  const produitsData = [
    { nom: 'Ciment Dangote 50kg', categorie: 'ciment', prix: 5500, stock: 500 },
    { nom: 'Fer à béton Ø12', categorie: 'fer', prix: 4200, stock: 800 },
    { nom: 'Carrelage 60x60 blanc', categorie: 'carrelage', prix: 8500, stock: 200 },
    { nom: 'Peinture acrylique 20L', categorie: 'peinture', prix: 28000, stock: 120 },
    { nom: 'Gravier 15/25 (m³)', categorie: 'agregats', prix: 18000, stock: 60 },
    { nom: 'Tôle bac alu 5m', categorie: 'toiture', prix: 12500, stock: 150 },
    { nom: 'Sable fin (m³)', categorie: 'agregats', prix: 12000, stock: 80 },
    { nom: 'Ciment CIPROCO 50kg', categorie: 'ciment', prix: 5300, stock: 400 },
    { nom: 'Fer Ø8', categorie: 'fer', prix: 2800, stock: 1000 },
    { nom: 'Vis à bois assorties', categorie: 'quincaillerie', prix: 2500, stock: 300 },
    { nom: 'Peinture glycéro 5L', categorie: 'peinture', prix: 9500, stock: 90 },
    { nom: 'Faîtière toiture', categorie: 'toiture', prix: 3500, stock: 200 },
  ];

  const produits = [];
  for (let i = 0; i < produitsData.length; i += 1) {
    const p = produitsData[i];
    const vendeur = fournisseurs[i % fournisseurs.length];
    produits.push(
      await Produit.create({
        vendeurId: vendeur._id,
        nom: p.nom,
        description: `${p.nom} — qualité professionnelle.`,
        categorie: p.categorie,
        prixUnitaire: p.prix,
        unite: p.categorie === 'agregats' ? 'm³' : 'unité',
        stock: p.stock,
        actif: true,
        photos: [],
      })
    );
  }

  const formations = await Formation.insertMany([
    {
      titre: 'Gestion de chantier moderne',
      description: 'Planification, suivi budgétaire et sécurité.',
      modalite: 'presentiel',
      dateDebut: new Date(Date.now() + 20 * 24 * 3600 * 1000),
      dateFin: new Date(Date.now() + 22 * 24 * 3600 * 1000),
      dureeHeures: 16,
      lieu: 'Cotonou',
      placesTotal: 25,
      placesRestantes: 25,
      tarifMembre: 45000,
      tarifNonMembre: 65000,
      requiseLabelOr: true,
    },
    {
      titre: 'Devis et estimation digitale',
      description: 'Outils numériques pour chiffrer un projet.',
      modalite: 'en_ligne',
      dateDebut: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      dateFin: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      dureeHeures: 8,
      placesTotal: 40,
      placesRestantes: 40,
      tarifMembre: 25000,
      tarifNonMembre: 40000,
    },
    {
      titre: 'Normes qualité BTP Bénin',
      description: 'Cadre réglementaire et charte qualité BTB.',
      modalite: 'hybride',
      dateDebut: new Date(Date.now() + 45 * 24 * 3600 * 1000),
      dateFin: new Date(Date.now() + 46 * 24 * 3600 * 1000),
      dureeHeures: 12,
      lieu: 'Porto-Novo',
      placesTotal: 30,
      placesRestantes: 30,
      tarifMembre: 35000,
      tarifNonMembre: 55000,
      requiseLabelOr: true,
    },
    {
      titre: 'Sécurité sur les chantiers',
      description: 'EPI, prévention et gestes qui sauvent.',
      modalite: 'presentiel',
      dateDebut: new Date(Date.now() + 60 * 24 * 3600 * 1000),
      dateFin: new Date(Date.now() + 60 * 24 * 3600 * 1000),
      dureeHeures: 6,
      lieu: 'Abomey-Calavi',
      placesTotal: 35,
      placesRestantes: 35,
      tarifMembre: 20000,
      tarifNonMembre: 30000,
    },
  ]);

  // Avis publiés → post-hook recalcule notes
  if (pros.length >= 2) {
    await Avis.create({
      auteurId: client._id,
      cibleId: pros[0]._id,
      note: 5,
      commentaire: 'Travail soigné et délais respectés.',
      contexte: { type: 'ao', refId: aos[0]._id },
      statut: 'publie',
    });
    await Avis.create({
      auteurId: client._id,
      cibleId: pros[1]._id,
      note: 4,
      commentaire: 'Bonne communication, finitions correctes.',
      contexte: { type: 'ao', refId: aos[1]._id },
      statut: 'publie',
    });
  }

  const conv = await Conversation.create({
    participants: [client._id, pros[0]._id],
    contexte: { type: 'annuaire', refId: pros[0]._id, label: 'Contact annuaire' },
    nonLus: { [pros[0]._id.toString()]: 1, [client._id.toString()]: 0 },
    dernierMessageApercu: 'Bonjour, je souhaite un devis.',
  });

  await Message.create({
    conversationId: conv._id,
    auteurId: client._id,
    corps: 'Bonjour, je souhaite un devis pour ma villa.',
    luPar: [client._id],
  });

  await Notification.create({
    userId: pros[0]._id,
    type: 'message',
    titre: 'Nouveau message',
    corps: 'Vous avez reçu un message via l’annuaire.',
    lien: `/dashboard?msg=${conv._id}`,
  });

  logger.info(
    {
      superadmin: superadmin.email,
      membres: membres.length,
      aos: aos.length,
      produits: produits.length,
      formations: formations.length,
    },
    'Seed terminé'
  );

  await disconnectMongo();
}

seed().catch(async (err) => {
  logger.error({ err }, 'Seed échoué');
  await disconnectMongo().catch(() => {});
  process.exit(1);
});
