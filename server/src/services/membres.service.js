import { User } from '../models/User.js';
import { Avis } from '../models/Avis.js';
import { AppError } from '../utils/apiResponse.js';
import { LABEL_NIVEAUX } from '../config/constants.js';

const PUBLIC_PROJECTION = {
  passwordHash: 0,
  refreshTokenHash: 0,
  passwordResetTokenHash: 0,
  passwordResetExpireAt: 0,
  email: 0,
  telephone: 0,
  localisation: 0,
  ifu: 0,
  rccm: 0,
  rccmDocumentUrl: 0,
  rccmDocumentNom: 0,
  __v: 0,
};

const LABEL_RANK = { or: 3, argent: 2, bronze: 1 };

function sortMembres(a, b) {
  const la = LABEL_RANK[a.label?.niveau] || 0;
  const lb = LABEL_RANK[b.label?.niveau] || 0;
  if (lb !== la) return lb - la;
  const pa = a.palier === 'premium' ? 1 : 0;
  const pb = b.palier === 'premium' ? 1 : 0;
  if (pb !== pa) return pb - pa;
  return (b.noteMoyenne || 0) - (a.noteMoyenne || 0);
}

export async function listMembres(query) {
  const {
    q,
    metier,
    departement,
    label,
    disponible,
    page = 1,
    limit = 12,
  } = query;

  const filter = {
    fichePubliee: true,
    statut: 'actif',
    role: { $in: ['membre', 'admin', 'superadmin'] },
  };

  if (metier) filter.metiers = metier;
  if (departement) filter.departement = departement;
  if (label && LABEL_NIVEAUX.includes(label)) filter['label.niveau'] = label;
  if (disponible === 'true' || disponible === true) filter.disponible = true;
  if (disponible === 'false' || disponible === false) filter.disponible = false;

  if (q) {
    filter.$text = { $search: q };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [rows, total] = await Promise.all([
    User.find(filter, PUBLIC_PROJECTION).lean(),
    User.countDocuments(filter),
  ]);

  const sorted = rows.sort(sortMembres);
  const data = sorted.slice(skip, skip + Number(limit));

  return {
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      hasMore: skip + data.length < total,
    },
  };
}

export async function nearMembres({ lng, lat, maxDistance = 30000, limit = 50 }) {
  if (lng == null || lat == null) {
    throw new AppError('Coordonnées requises', { status: 400, code: 'VALIDATION_ERROR' });
  }

  const results = await User.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        distanceField: 'distance',
        maxDistance: Number(maxDistance),
        spherical: true,
        query: {
          fichePubliee: true,
          statut: 'actif',
          localisation: { $exists: true },
        },
      },
    },
    { $limit: Number(limit) },
    {
      $project: {
        passwordHash: 0,
        refreshTokenHash: 0,
        passwordResetTokenHash: 0,
        email: 0,
        telephone: 0,
        localisation: 0,
        ifu: 0,
        rccm: 0,
        rccmDocumentUrl: 0,
        rccmDocumentNom: 0,
        __v: 0,
      },
    },
  ]);

  // Ne pas exposer lat/lng ; garder distance arrondie
  return results.map((m) => ({
    ...m,
    distance: Math.round(m.distance),
  })).sort(sortMembres);
}

/** Markers carte : coordonnées uniquement pour affichage carte (pas email/tel). */
export async function mapMarkers({ departement, metier, label } = {}) {
  const filter = {
    fichePubliee: true,
    statut: 'actif',
    'localisation.coordinates.0': { $exists: true },
  };
  if (departement) filter.departement = departement;
  if (metier) filter.metiers = metier;
  if (label) filter['label.niveau'] = label;

  const rows = await User.find(filter)
    .select('slug entreprise prenom nom label noteMoyenne palier logoUrl localisation.coordinates metiers ville')
    .lean();

  return rows.map((u) => ({
    slug: u.slug,
    titre: u.entreprise || `${u.prenom || ''} ${u.nom || ''}`.trim(),
    label: u.label?.niveau || null,
    noteMoyenne: u.noteMoyenne,
    palier: u.palier,
    logoUrl: u.logoUrl,
    metiers: u.metiers,
    ville: u.ville,
    lng: u.localisation.coordinates[0],
    lat: u.localisation.coordinates[1],
  }));
}

export async function getBySlug(slug) {
  const user = await User.findOne(
    { slug, fichePubliee: true, statut: 'actif' },
    PUBLIC_PROJECTION
  ).lean();
  if (!user) throw new AppError('Fiche introuvable', { status: 404, code: 'NOT_FOUND' });

  const avis = await Avis.find({
    cibleId: user._id,
    statut: 'publie',
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('note commentaire createdAt contexte')
    .lean();

  return { ...user, avis };
}

export async function updateMonProfil(userId, payload) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Introuvable', { status: 404, code: 'NOT_FOUND' });

  const allowed = [
    'entreprise',
    'presentation',
    'metiers',
    'departement',
    'ville',
    'zonesIntervention',
    'disponible',
    'fichePubliee',
    'telephone',
  ];
  for (const key of allowed) {
    if (payload[key] !== undefined) user[key] = payload[key];
  }

  if (payload.lng != null && payload.lat != null) {
    user.localisation = {
      type: 'Point',
      coordinates: [Number(payload.lng), Number(payload.lat)],
    };
  }

  if (payload.references) {
    user.references = payload.references;
  }

  await user.save();
  return user.toJSON();
}

export async function setLogo(userId, url) {
  const user = await User.findByIdAndUpdate(userId, { logoUrl: url }, { new: true });
  return user.toJSON();
}

export async function addReference(userId, reference) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Introuvable', { status: 404, code: 'NOT_FOUND' });
  user.references.push(reference);
  await user.save();
  return user.toJSON();
}
