import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';

export default function MesReponsesPage() {
  const { data: reponses = [] } = useQuery({
    queryKey: ['mes-reponses'],
    queryFn: async () => (await api.get('/appels-offres/mes-reponses')).data.data,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Mes réponses</h1>
      <Link to="/dashboard/mes-ao" className="mt-2 inline-block text-sm font-bold text-bleu">
        ← Mes AO
      </Link>

      <div className="mt-8 space-y-3">
        {reponses.length === 0 && (
          <div className="card p-8 text-center text-sm text-black/60">Aucune réponse déposée.</div>
        )}
        {reponses.map((r) => (
          <div key={r._id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <div className="font-display text-lg font-extrabold">{r.aoId?.titre || 'AO'}</div>
              <p className="text-sm text-black/60">
                {formatFcfa(r.montant)} · {r.delaiJours} jours
              </p>
            </div>
            <span
              className={`rounded-pill px-3 py-1 text-xs font-extrabold uppercase ${
                r.statut === 'retenue'
                  ? 'bg-orange text-white'
                  : r.statut === 'non_retenue'
                    ? 'bg-fond-doux text-black/50'
                    : 'bg-bleu-soft text-bleu'
              }`}
            >
              {r.statut.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
