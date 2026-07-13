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

function LabelBadge({ niveau }) {
  if (!niveau) return null;
  const colors = {
    or: 'bg-amber-100 text-amber-800',
    argent: 'bg-slate-200 text-slate-700',
    bronze: 'bg-orange-100 text-orange-800',
  };
  return (
    <span className={`rounded-pill px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${colors[niveau] || 'bg-fond-doux'}`}>
      {niveau}
    </span>
  );
}

function Stars({ note }) {
  const n = Math.round(note || 0);
  return (
    <span className="text-xs font-bold text-orange" aria-label={`${note} sur 5`}>
      {'★'.repeat(n)}
      {'☆'.repeat(5 - n)}
    </span>
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
        params: {
          metier: metier || undefined,
          departement: departement || undefined,
          label: label || undefined,
        },
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
      const { data } = await api.get('/membres/near', {
        params: { lat, lng, maxDistance: 40000 },
      });
      setItems(data.data);
      setPagination({ hasMore: false, total: data.data.length });
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <p className="eyebrow">Annuaire géolocalisé</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Professionnels du BTP</h1>
      <p className="mt-2 max-w-2xl text-black/65">
        Recherchez par métier, département et label. Tri : Or → Argent → Bronze, puis Premium, puis note.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <input
          value={q}
          onChange={(e) => resetAndFilter(() => setQ(e.target.value))}
          placeholder="Rechercher une entreprise, une ville…"
          className="w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3 font-medium"
        />
        <div className="flex flex-wrap gap-2">
          {METIERS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => resetAndFilter(() => setMetier(metier === m.value ? '' : m.value))}
              className={`rounded-pill px-3 py-1.5 text-xs font-extrabold ${
                metier === m.value ? 'bg-bleu text-white' : 'bg-fond-doux'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={departement}
            onChange={(e) => resetAndFilter(() => setDepartement(e.target.value))}
            className="rounded-pill border-[1.5px] border-black/10 bg-white px-4 py-2 text-sm font-bold"
          >
            <option value="">Tous départements</option>
            {DEPARTEMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {LABEL_NIVEAUX.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => resetAndFilter(() => setLabel(label === l ? '' : l))}
              className={`rounded-pill px-3 py-1.5 text-xs font-extrabold capitalize ${
                label === l ? 'bg-ink text-white' : 'bg-fond-doux'
              }`}
            >
              {l}
            </button>
          ))}
          <button
            type="button"
            onClick={() => resetAndFilter(() => setDisponible(!disponible))}
            className={`rounded-pill px-3 py-1.5 text-xs font-extrabold ${
              disponible ? 'bg-orange text-white' : 'bg-fond-doux'
            }`}
          >
            Disponible
          </button>
          <button type="button" onClick={aroundMe} className="btn-line !px-4 !py-2 text-xs">
            Autour de moi
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {items.length === 0 && !isFetching && (
            <div className="card p-10 text-center">
              <p className="font-display text-xl font-extrabold">Aucun professionnel trouvé</p>
              <p className="mt-2 text-sm text-black/60">Élargissez vos filtres ou explorez la carte.</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((m) => (
              <Link key={m._id || m.slug} to={`/pro/${m.slug}`} className="card block p-5 transition hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg font-extrabold leading-tight">
                    {m.entreprise || `${m.prenom} ${m.nom}`}
                  </h2>
                  <LabelBadge niveau={m.label?.niveau} />
                </div>
                <p className="mt-1 text-sm text-black/55">
                  {m.ville}
                  {m.departement ? ` · ${m.departement}` : ''}
                  {m.distance != null ? ` · ${Math.round(m.distance / 1000)} km` : ''}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <Stars note={m.noteMoyenne} />
                  {m.palier === 'premium' && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-bleu">Premium</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {pagination?.hasMore && (
            <button
              type="button"
              className="btn-line mt-6"
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
            >
              Charger plus
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-[24px] border-[1.5px] border-card shadow-soft h-[420px] lg:sticky lg:top-24">
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
