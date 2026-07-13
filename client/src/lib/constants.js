export const PROFIL_OPTIONS = [
  {
    value: 'entreprise_btp',
    title: 'Entreprise BTP',
    desc: 'Entreprise de construction, rénovation ou génie civil.',
  },
  {
    value: 'artisan',
    title: 'Artisan',
    desc: 'Professionnel qualifié sur un ou plusieurs métiers du bâtiment.',
  },
  {
    value: 'prestataire',
    title: 'Prestataire',
    desc: 'Bureau d\'études, topographe, architecte ou prestataire technique.',
  },
  {
    value: 'fournisseur',
    title: 'Fournisseur',
    desc: 'Vendeur de matériaux et équipements de construction.',
  },
  {
    value: 'maitre_ouvrage',
    title: 'Maître d\'ouvrage',
    desc: 'Client ou promoteur recherchant des professionnels fiables.',
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
    features: ['Fiche annuaire', '2 réponses AO / mois', 'Messagerie limitée'],
  },
  {
    value: 'standard',
    title: 'Standard',
    price: 50000,
    features: ['Réponses AO illimitées', 'Badge membre', 'Alertes métiers'],
  },
  {
    value: 'premium',
    title: 'Premium',
    price: 150000,
    features: ['AO 24 h à l\'avance', 'Boost annuaire', 'Support prioritaire'],
  },
  {
    value: 'fournisseur',
    title: 'Fournisseur',
    price: 75000,
    features: ['Boutique matériaux', 'Stock & commandes', 'Visibilité catalogue'],
  },
];

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
Les abonnements, labellisations, formations et commandes sont payés en FCFA via FSPay. Aucune commission n'est prélevée sur les mises en relation issues de l'adhésion.

Article 8 — Acceptation
En cochant la case d'acceptation, le membre reconnaît avoir lu et accepté la présente charte. L'acceptation est horodatée et conservée.`;

export function formatFcfa(n) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}
