import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { DEPARTEMENTS, METIERS } from '../lib/constants';
import { LABEL_NIVEAUX } from './annuaireHelpers';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 12, { duration: 1.2 });
  }, [center, map]);
  return null;
}

const LABEL_STYLE = {
  or: 'bg-amber-100 text-amber-800',
  argent: 'bg-slate-200 text-slate-700',
  bronze: 'bg-orange-100 text-orange-800',
};

function LabelBadge({ niveau }) {
  if (!niveau) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${LABEL_STYLE[niveau] || 'bg-fond-doux'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><circle cx="12" cy="9" r="6" /><path d="M9 14l-2 7 5-3 5 3-2-7" /></svg>
      {niveau}
    </span>
  );
}

function Stars({ note }) {
  const n = Math.round(note || 0);
  return (
    <span className="text-xs font-bold text-orange" aria-label={`${note} sur 5`}>
      {'★'.repeat(n)}
      <span className="text-black/15">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

const Pin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
);

function ProCard({ m }) {
  const titre = m.entreprise || `${m.prenom || ''} ${m.nom || ''}`.trim();
  return (
    <Link to={`/pro/${m.slug}`} className="card card-hover group block p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-bleu-soft text-base font-extrabold text-bleu">
          {(titre[0] || 'B').toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-[17px] font-extrabold leading-tight">{titre}</h2>
            <LabelBadge niveau={m.label?.niveau} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gris">
            <Pin />
            {m.ville}{m.departement ? ` · ${m.departement}` : ''}{m.distance != null ? ` · ${Math.round(m.distance / 1000)} km` : ''}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-filet pt-3">
        <Stars note={m.noteMoyenne} />
        <span className="flex items-center gap-2">
          {m.palier === 'premium' && <span className="chip">Premium</span>}
          <span className="text-gris transition group-hover:translate-x-1 group-hover:text-orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </span>
      </div>
    </Link>
  );
}

export default function AnnuairePage() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [metier, setMetier] = useState('');
  const [departement, setDepartement] = useState('');
  const [label, setLabel] = useState('');
  const [disponible, setDisponible] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [mapCenter, setMapCenter] = useState([6.37, 2.43]);
  const [nearMode, setNearMode] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const filters = useMemo(
    () => ({
      q: debouncedQ || undefined,
      metier: metier || undefined,
      departement: departement || undefined,
      label: label || undefined,
      disponible: disponible ? 'true' : undefined,
      page,
      limit: 12,
    }),
    [debouncedQ, metier, departement, label, disponible, page]
  );

  const { isFetching } = useQuery({
    queryKey: ['membres', filters, nearMode],
    queryFn: async () => {
      if (nearMode) return null;
      const { data } = await api.get('/membres', { params: filters });
      if (page === 1) setItems(data.data);
      else setItems((prev) => [...prev, ...data.data]);
      setPagination(data.pagination);
      return data;
    },
    enabled: !nearMode,
  });

  const markersQuery = useQuery({
    queryKey: ['markers', metier, departement, label],
    queryFn: async () => {
      const { data } = await api.get('/membres/markers', {
        params: { metier: metier || undefined, departement: departement || undefined, label: label || undefined },
      });
      return data.data;
    },
  });

  const resetAndFilter = useCallback((fn) => {
    setPage(1);
    setNearMode(false);
    fn();
  }, []);

  async function aroundMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setMapCenter([lat, lng]);
      setNearMode(true);
      const { data } = await api.get('/membres/near', { params: { lat, lng, maxDistance: 40000 } });
      setItems(data.data);
      setPagination({ hasMore: false, total: data.data.length });
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <p className="eyebrow">Annuaire géolocalisé</p>
      <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Professionnels du BTP</h1>
      <p className="mt-2 max-w-2xl text-gris">
        Recherchez par métier, département et label. Tri : Or → Argent → Bronze, puis Premium, puis note.
      </p>

      {/* Barre de filtres */}
      <div className="card mt-6 p-4 md:p-5">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gris">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
          <input
            value={q}
            onChange={(e) => resetAndFilter(() => setQ(e.target.value))}
            placeholder="Rechercher une entreprise, une ville…"
            className="input pl-11"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {METIERS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => resetAndFilter(() => setMetier(metier === m.value ? '' : m.value))}
              className={`rounded-pill border px-3.5 py-1.5 text-xs font-extrabold transition ${
                metier === m.value ? 'border-bleu bg-bleu text-white' : 'border-filet bg-white text-ink hover:border-bleu'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-filet pt-4">
          <select
            value={departement}
            onChange={(e) => resetAndFilter(() => setDepartement(e.target.value))}
            className="input !w-auto !py-2 !text-sm !font-bold"
          >
            <option value="">Tous départements</option>
            {DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {LABEL_NIVEAUX.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => resetAndFilter(() => setLabel(label === l ? '' : l))}
              className={`rounded-pill border px-3.5 py-2 text-xs font-extrabold capitalize transition ${
                label === l ? 'border-ink bg-ink text-white' : 'border-filet bg-white hover:border-ink'
              }`}
            >
              {l}
            </button>
          ))}
          <button
            type="button"
            onClick={() => resetAndFilter(() => setDisponible(!disponible))}
            className={`rounded-pill border px-3.5 py-2 text-xs font-extrabold transition ${
              disponible ? 'border-orange bg-orange text-white' : 'border-filet bg-white hover:border-orange'
            }`}
          >
            Disponible
          </button>
          <button type="button" onClick={aroundMe} className="btn-line btn-sm ml-auto">
            <Pin /> Autour de moi
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {items.length === 0 && !isFetching && (
            <div className="card flex flex-col items-center p-12 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-bleu-soft text-bleu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              </span>
              <p className="mt-5 text-xl font-extrabold">Aucun professionnel pour le moment</p>
              <p className="mt-2 max-w-sm text-sm text-gris">
                L&apos;annuaire se remplira lorsque les membres publieront leur fiche depuis leur espace.
              </p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((m) => <ProCard key={m._id || m.slug} m={m} />)}
          </div>
          {pagination?.hasMore && (
            <div className="mt-6 flex justify-center">
              <button type="button" className="btn-line" onClick={() => setPage((p) => p + 1)} disabled={isFetching}>
                {isFetching ? 'Chargement…' : 'Charger plus'}
              </button>
            </div>
          )}
        </div>

        <div className="h-[440px] overflow-hidden rounded-card border border-filet shadow-soft lg:sticky lg:top-24">
          <MapContainer center={mapCenter} zoom={11} className="h-full w-full" scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo center={mapCenter} />
            {(markersQuery.data || []).map((m) => (
              <Marker key={m.slug} position={[m.lat, m.lng]} icon={markerIcon}>
                <Popup>
                  <strong>{m.titre}</strong>
                  <br />
                  <Link to={`/pro/${m.slug}`}>Voir la fiche</Link>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
