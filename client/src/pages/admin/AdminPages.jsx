import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { formatFcfa } from '../../lib/constants';
import toast from 'react-hot-toast';

export function AdminStatsPage() {
  const { data } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/stats')).data.data,
  });
  const max = Math.max(...(data?.inscriptions12m?.map((i) => i.count) || [1]), 1);

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Statistiques</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs font-extrabold uppercase text-black/50">Membres actifs</p>
          <p className="mt-2 font-display text-4xl font-extrabold">{data?.membresActifs ?? '—'}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-extrabold uppercase text-black/50">Volume FCFA 30 j</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-bleu">
            {data ? formatFcfa(data.volumeFcfa30j) : '—'}
          </p>
        </div>
      </div>
      <h2 className="mt-8 font-display text-xl font-extrabold">Inscriptions 12 mois</h2>
      <div className="card mt-4 flex h-48 items-end gap-2 p-4">
        {(data?.inscriptions12m || []).map((p) => (
          <div key={p._id} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-lg bg-orange"
              style={{ height: `${(p.count / max) * 100}%`, minHeight: 4 }}
              title={`${p._id}: ${p.count}`}
            />
            <span className="text-[9px] font-bold text-black/45">{p._id.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDossiersPage() {
  const qc = useQueryClient();
  const { data: dossiers = [] } = useQuery({
    queryKey: ['admin-dossiers'],
    queryFn: async () => (await api.get('/admin/dossiers')).data.data,
  });

  async function transition(id, to) {
    try {
      await api.patch(`/admin/dossiers/${id}`, { to });
      toast.success('OK');
      qc.invalidateQueries({ queryKey: ['admin-dossiers'] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Transition invalide');
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Dossiers labellisation</h1>
      <div className="mt-6 space-y-3">
        {dossiers.map((d) => (
          <div key={d._id} className="card p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{d.membreId?.entreprise || d.membreId?.email}</strong>
              <span className="capitalize">{d.niveauDemande} · {d.statut}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {['en_examen', 'pieces_manquantes', 'visite_programmee', 'valide', 'rejete'].map((to) => (
                <button
                  key={to}
                  type="button"
                  className="btn-line !px-2 !py-1 text-[10px]"
                  onClick={() => transition(d._id, to)}
                >
                  → {to}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminMembresPage() {
  const qc = useQueryClient();
  const { data: membres = [] } = useQuery({
    queryKey: ['admin-membres'],
    queryFn: async () => (await api.get('/admin/membres')).data.data,
  });

  async function suspendre(id) {
    const motif = window.prompt('Motif de suspension ?');
    if (!motif) return;
    await api.post(`/admin/membres/${id}/suspendre`, { motif });
    toast.success('Suspendu');
    qc.invalidateQueries({ queryKey: ['admin-membres'] });
  }

  async function reactiver(id) {
    await api.post(`/admin/membres/${id}/reactiver`);
    toast.success('Réactivé');
    qc.invalidateQueries({ queryKey: ['admin-membres'] });
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Membres</h1>
      <div className="mt-6 space-y-2">
        {membres.map((m) => (
          <div key={m._id} className="card flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <div>
              <strong>{m.entreprise || `${m.prenom} ${m.nom}`}</strong>
              <div className="text-xs text-black/50">{m.email} · {m.statut}</div>
            </div>
            <div className="flex gap-2">
              {m.statut !== 'suspendu' ? (
                <button type="button" className="btn-line !px-3 !py-1.5 text-xs" onClick={() => suspendre(m._id)}>
                  Suspendre
                </button>
              ) : (
                <button type="button" className="btn-orange !px-3 !py-1.5 text-xs" onClick={() => reactiver(m._id)}>
                  Réactiver
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminModerationPage() {
  const qc = useQueryClient();
  const { data: avis = [] } = useQuery({
    queryKey: ['admin-avis'],
    queryFn: async () => (await api.get('/admin/moderation/avis')).data.data,
  });
  const { data: prix = [] } = useQuery({
    queryKey: ['admin-prix'],
    queryFn: async () => (await api.get('/admin/moderation/prix-anormaux')).data.data,
  });
  const { data: doublons = [] } = useQuery({
    queryKey: ['admin-ao-dup'],
    queryFn: async () => (await api.get('/admin/moderation/ao-doublons')).data.data,
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Modération</h1>
        <h2 className="mt-6 font-display text-xl font-extrabold">Avis</h2>
        <div className="mt-3 space-y-2">
          {avis.map((a) => (
            <div key={a._id} className="card p-4 text-sm">
              <p>{a.commentaire} · {a.note}/5 · {a.statut}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn-orange !px-3 !py-1 text-xs" onClick={async () => {
                  await api.patch(`/admin/moderation/avis/${a._id}`, { publier: true });
                  qc.invalidateQueries({ queryKey: ['admin-avis'] });
                }}>Publier</button>
                <button type="button" className="btn-line !px-3 !py-1 text-xs" onClick={async () => {
                  await api.patch(`/admin/moderation/avis/${a._id}`, { publier: false });
                  qc.invalidateQueries({ queryKey: ['admin-avis'] });
                }}>Rejeter</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-display text-xl font-extrabold">Prix anormaux (&lt; 30 % médiane)</h2>
        <div className="mt-3 space-y-2 text-sm">
          {prix.map((p) => (
            <div key={p._id} className="card p-3">{p.nom} — {formatFcfa(p.prixUnitaire)} (médiane {formatFcfa(p.mediane)})</div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-display text-xl font-extrabold">AO en doublon</h2>
        <div className="mt-3 space-y-2 text-sm">
          {doublons.map((d) => (
            <div key={JSON.stringify(d._id)} className="card p-3">{d._id?.titre} × {d.count}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminAuditPage() {
  const { data: logs = [] } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: async () => (await api.get('/admin/audit')).data.data,
  });
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Journal d&apos;audit</h1>
      <div className="mt-6 space-y-2">
        {logs.map((l) => (
          <div key={l._id} className="card p-3 text-xs">
            <strong>{l.action}</strong> · {l.ressource} · {new Date(l.createdAt).toLocaleString('fr-FR')}
          </div>
        ))}
      </div>
    </div>
  );
}
