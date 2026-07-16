/** Droits par formule d'adhésion */

export const DROITS_PALIER = {
  decouverte: {
    ficheBase: true,
    annuaire: true,
    reponsesAoMois: 2,
    messagerie: false,
    alertesAo: false,
    earlyAo: false,
    boutique: false,
    boostAnnuaire: false,
    multiComptes: false,
    stats: false,
    badgeVerifie: false,
  },
  standard: {
    ficheBase: true,
    ficheComplete: true,
    annuaire: true,
    reponsesAoMois: Infinity,
    messagerie: true,
    alertesAo: true,
    earlyAo: false,
    boutique: true,
    boostAnnuaire: false,
    multiComptes: false,
    stats: false,
    badgeVerifie: false,
    dashboardProjets: true,
  },
  premium: {
    ficheBase: true,
    ficheComplete: true,
    annuaire: true,
    reponsesAoMois: Infinity,
    messagerie: true,
    alertesAo: true,
    earlyAo: true,
    boutique: true,
    boostAnnuaire: true,
    multiComptes: true,
    stats: true,
    badgeVerifie: true,
    dashboardProjets: true,
  },
  access: {
    ficheBase: true,
    ficheComplete: true,
    annuaire: true,
    reponsesAoMois: Infinity,
    messagerie: true,
    alertesAo: true,
    earlyAo: false,
    boutique: true,
    boostAnnuaire: false,
    multiComptes: false,
    stats: false,
    badgeVerifie: false,
    vitrineEcommerce: true,
  },
  business: {
    ficheBase: true,
    ficheComplete: true,
    annuaire: true,
    reponsesAoMois: Infinity,
    messagerie: true,
    alertesAo: true,
    earlyAo: true,
    boutique: true,
    boostAnnuaire: true,
    multiComptes: true,
    stats: true,
    badgeVerifie: true,
    vitrineEcommerce: true,
    spotsPromo: true,
    aLaCarte: true,
  },
};

export function droitsPour(palier) {
  return DROITS_PALIER[palier] || DROITS_PALIER.decouverte;
}

export function peutBoutique(palier) {
  return Boolean(droitsPour(palier).boutique);
}

export function peutMessagerie(palier) {
  return Boolean(droitsPour(palier).messagerie);
}
