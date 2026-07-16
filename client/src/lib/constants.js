/** Formalités selon le profil métier technique (API) */
export const FORMALITES_PAR_PROFIL = {
  entreprise_btp: ['RCCM (PDF/DOC)', 'IFU', 'Raison sociale', 'Zones d’intervention'],
  artisan: ['RCCM (PDF/DOC)', 'Métiers', 'Présentation / CV', 'Téléphone'],
  prestataire: ['RCCM (PDF/DOC)', 'IFU', 'Métiers techniques', 'Présentation'],
  fournisseur: ['RCCM (PDF/DOC)', 'IFU', 'Raison sociale', 'Catalogue / métiers fourniture'],
  maitre_ouvrage: ['Identité', 'Téléphone', 'Structure (optionnel)', 'Pas de RCCM requis'],
};

/**
 * Cibles (= profils d’inscription) par formule — alignées sur la grille tarifaire.
 * `profilType` : valeur envoyée à l’API.
 */
export const CIBLES_PAR_FORMULE = {
  decouverte: [
    {
      value: 'pme_informelle',
      title: 'PME informelle / primo-inscrit',
      desc: 'Structure en phase d’implantation, à convertir vers une offre payante.',
      profilType: 'entreprise_btp',
    },
    {
      value: 'pro_btp',
      title: 'Professionnel de BTP',
      desc: 'CV de professionnel qualifié en quête d’emplois et d’opportunités.',
      profilType: 'artisan',
    },
    {
      value: 'particulier_promoteur_cabinet',
      title: 'Particulier, promoteur ou cabinet d’études',
      desc: 'Particuliers, promoteurs immobiliers, cabinets d’études, etc.',
      profilType: 'maitre_ouvrage',
    },
  ],
  standard: [
    {
      value: 'pme_structuree',
      title: 'PME structurée / prescripteur',
      desc: 'Entreprise organisée répondant régulièrement aux appels d’offres.',
      profilType: 'entreprise_btp',
    },
    {
      value: 'cabinet_etudes',
      title: 'Cabinet d’études',
      desc: 'Bureau d’études, ingénierie, architecture ou topographie.',
      profilType: 'prestataire',
    },
  ],
  premium: [
    {
      value: 'entreprise_etablie',
      title: 'Entreprise établie',
      desc: 'Société BTP avec historique, label et multi-utilisateurs.',
      profilType: 'entreprise_btp',
    },
    {
      value: 'fournisseur_actif',
      title: 'Fournisseur actif',
      desc: 'Fournisseur déjà actif sur le marché, mise en avant Premium.',
      profilType: 'fournisseur',
    },
  ],
  access: [
    {
      value: 'vendeur_materiaux',
      title: 'Vendeur de matériaux',
      desc: 'Boutique e-commerce / vitrine au forfait Access.',
      profilType: 'fournisseur',
    },
    {
      value: 'negociant',
      title: 'Négociant',
      desc: 'Négociant en matériaux et équipements de construction.',
      profilType: 'fournisseur',
    },
  ],
  business: [
    {
      value: 'offreur_btp',
      title: 'Offreur de produits et services BTP',
      desc: 'Besoins complexes à la carte : spots, promotions spéciales, etc.',
      profilType: 'entreprise_btp',
    },
    {
      value: 'promoteur_immo',
      title: 'Promoteur immobilier',
      desc: 'Promoteur avec besoins spécifiques et accompagnement commercial.',
      profilType: 'maitre_ouvrage',
    },
  ],
};

export function ciblesPourFormule(palier) {
  return CIBLES_PAR_FORMULE[palier] || [];
}

export function formalitesPour(profilType) {
  return FORMALITES_PAR_PROFIL[profilType] || [];
}

/** @deprecated — préférer CIBLES_PAR_FORMULE ; conservé pour compat. */
export const PROFIL_OPTIONS = [
  {
    value: 'entreprise_btp',
    title: 'Entreprise BTP',
    desc: 'Construction, rénovation ou génie civil.',
    formalites: FORMALITES_PAR_PROFIL.entreprise_btp,
  },
  {
    value: 'artisan',
    title: 'Artisan / Professionnel',
    desc: 'Professionnel qualifié du bâtiment.',
    formalites: FORMALITES_PAR_PROFIL.artisan,
  },
  {
    value: 'prestataire',
    title: 'Cabinet / Prestataire',
    desc: 'Bureau d’études et prestataires techniques.',
    formalites: FORMALITES_PAR_PROFIL.prestataire,
  },
  {
    value: 'fournisseur',
    title: 'Fournisseur / Négociant',
    desc: 'Vendeurs de matériaux.',
    formalites: FORMALITES_PAR_PROFIL.fournisseur,
  },
  {
    value: 'maitre_ouvrage',
    title: 'Maître d’ouvrage / Promoteur',
    desc: 'Clients et promoteurs.',
    formalites: FORMALITES_PAR_PROFIL.maitre_ouvrage,
  },
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
  { value: 'maconnerie', label: 'Maçonnerie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'carrelage', label: 'Carrelage' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'charpente', label: 'Charpente' },
  { value: 'bureau_etudes', label: 'Bureau d\'études' },
  { value: 'topographie', label: 'Topographie' },
  { value: 'fourniture_materiaux', label: 'Fourniture matériaux' },
];

export const PALIERS = [
  {
    value: 'decouverte',
    title: 'Découverte',
    price: 0,
    cible: 'PME informelles · pros BTP · particuliers',
    features: [
      'Profil de base',
      'Consultation de l’annuaire',
      'Candidatures limitées aux opportunités (2 / mois)',
      'CV de professionnels qualifiés',
    ],
  },
  {
    value: 'standard',
    title: 'Standard',
    price: 200000,
    cible: 'PME structurées · cabinets d’études',
    features: [
      'Profil complet',
      'Réponses AO illimitées',
      'Messagerie & tableau de bord projets',
      'Alertes appels d’offres',
      'Publication de produits dans la Marketplace',
      'Appels d’offres publiés et réponses reçues',
    ],
  },
  {
    value: 'premium',
    title: 'Premium',
    price: 500000,
    cible: 'Entreprises établies · fournisseurs actifs',
    features: [
      'Badge vérifié & mise en avant annuaire',
      'Accès anticipé aux opportunités',
      'Statistiques & comptes multi-utilisateurs',
      'Marketplace sans commission',
    ],
  },
  {
    value: 'access',
    title: 'Access',
    price: 1000000,
    cible: 'Vendeurs de matériaux · négociants',
    features: [
      'Vitrine Marketplace et demandes directes',
      'Options de visibilité',
      '0 % de rétrocession sur les mises en relation',
    ],
  },
  {
    value: 'business',
    title: 'Business',
    price: null,
    cible: 'Offreurs BTP · promoteurs',
    features: [
      'Offre à la carte (spots, promotions, etc.)',
      'Accompagnement commercial dédié',
      'Droits sur mesure',
    ],
  },
];

export const DROITS_PALIER = {
  decouverte: { messagerie: false, boutique: false, labellisation: true, ao: true, formations: true },
  standard: { messagerie: true, boutique: true, labellisation: true, ao: true, formations: true },
  premium: { messagerie: true, boutique: true, labellisation: true, ao: true, formations: true, stats: true },
  access: { messagerie: true, boutique: true, labellisation: true, ao: true, formations: true },
  business: { messagerie: true, boutique: true, labellisation: true, ao: true, formations: true, stats: true },
};

export function droitsClient(palier) {
  return DROITS_PALIER[palier] || DROITS_PALIER.decouverte;
}

export const CHARTE_TEXT = `Charte d'adhésion — Bénin Top Builders

Article 1 — Objet
La présente charte définit les engagements réciproques entre Bénin Top Builders (BTB) et le membre adhérent sur la plateforme numérique du BTP au Bénin.

Article 2 — Exactitude des informations
Le membre s'engage à fournir des informations exactes, à jour et vérifiables (identité, entreprise, IFU/RCCM, références). Toute fausse déclaration peut entraîner la suspension du compte.

Article 3 — Labellisation
Les labels Bronze, Argent et Or sont attribués après audit. Leur usage est soumis au maintien des conditions de qualité et à un renouvellement annuel.

Article 4 — Conduite professionnelle
Le membre s'interdit toute pratique frauduleuse, dumping anormal, usurpation d'identité ou contournement de la messagerie intermédiée.

Article 5 — Appels d'offres et marketplace
Les réponses aux appels d'offres et les offres de matériaux doivent refléter la capacité réelle d'exécution. Les stocks et délais annoncés doivent être honnêtes.

Article 6 — Confidentialité
Les données échangées via la plateforme restent confidentielles. Les coordonnées des non-membres sont masquées conformément aux règles de la messagerie.

Article 7 — Paiements
Les abonnements (Découverte 0 · Standard 200 000 · Premium 500 000 · Access 1 000 000 FCFA / an · Business sur devis), labellisations et formations sont payés en FCFA via FSPay. Les transactions issues de la Marketplace sont conclues hors plateforme et ne donnent lieu à aucune commission BTB.

Article 8 — Acceptation
En cochant la case d'acceptation, le membre reconnaît avoir lu et accepté la présente charte. L'acceptation est horodatée et conservée.`;

export function formatFcfa(n) {
  if (n == null) return 'Sur devis';
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

export function labelPalier(value) {
  return PALIERS.find((p) => p.value === value)?.title || value;
}
