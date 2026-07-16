/** Constantes métier Bénin Top Builders */

export const ROLES = ['visiteur', 'membre', 'formateur', 'admin', 'superadmin'];

export const PROFIL_TYPES = [
  'entreprise_btp',
  'artisan',
  'prestataire',
  'fournisseur',
  'maitre_ouvrage',
];

export const PALIERS = ['decouverte', 'standard', 'premium', 'access', 'business'];

export const LABEL_NIVEAUX = ['bronze', 'argent', 'or'];

export const USER_STATUS = [
  'pending_otp',
  'pending_charte',
  'pending_paiement',
  'actif',
  'expire',
  'suspendu',
];

export const DEPARTEMENTS = [
  'Alibori',
  'Atacora',
  'Atlantique',
  'Borgou',
  'Collines',
  'Couffo',
  'Donga',
  'Littoral',
  'Mono',
  'Ouémé',
  'Plateau',
  'Zou',
];

export const METIERS = [
  'maconnerie',
  'electricite',
  'plomberie',
  'menuiserie',
  'carrelage',
  'peinture',
  'charpente',
  'bureau_etudes',
  'topographie',
  'fourniture_materiaux',
];

export const DOSSIER_STATUS = [
  'soumis',
  'en_examen',
  'pieces_manquantes',
  'visite_programmee',
  'valide',
  'rejete',
];

export const AO_STATUS = ['ouvert', 'clos', 'attribue', 'annule'];

export const REPONSE_STATUS = ['recue', 'en_etude', 'retenue', 'non_retenue'];

export const COMMANDE_STATUS = [
  'demande_envoyee',
  'prise_de_contact',
  'finalisee',
  'en_attente_paiement',
  'payee',
  'en_preparation',
  'livree',
  'annulee',
];

export const PAIEMENT_TYPES = [
  'adhesion',
  'renouvellement',
  'labellisation',
  'commande',
  'formation',
  'visibilite',
];

export const PAIEMENT_STATUS = ['initie', 'en_cours', 'reussi', 'echec', 'expire'];

export const AVIS_STATUS = ['en_moderation', 'publie', 'signale', 'rejete'];

export const CATEGORIES_MATERIAUX = [
  'ciment',
  'fer',
  'carrelage',
  'peinture',
  'agregats',
  'toiture',
  'quincaillerie',
  'equipement',
  'outillage',
  'services',
  'immobilier',
  'autre',
];

export const FORMATION_MODALITES = ['presentiel', 'en_ligne', 'hybride'];

/** Tarifs annuels FCFA — `null` = à la carte (devis commercial) */
export const TARIFS_FCFA = {
  adhesion: {
    decouverte: 0,
    standard: 200000,
    premium: 500000,
    access: 1000000,
    business: null,
  },
  labellisation: {
    bronze: 75000,
    argent: 150000,
    or: 300000,
  },
  commissionMarketplace: 0,
};

/** Profils → formules recommandées à l'inscription */
export const PALIERS_PAR_PROFIL = {
  entreprise_btp: ['decouverte', 'standard', 'premium', 'business'],
  artisan: ['decouverte', 'standard', 'premium'],
  prestataire: ['decouverte', 'standard', 'premium'],
  fournisseur: ['access', 'business', 'premium'],
  maitre_ouvrage: ['decouverte', 'standard', 'business'],
};
