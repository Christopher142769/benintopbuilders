import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';

export default function MesAOPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const { data: aos = [] } = useQuery({
    queryKey: ['mes-ao'],
    queryFn: async () => (await api.get('/appels-offres/mes-ao')).data.data,
  });

  async function loadReponses(aoId) {
    const { data } = await api.get(`/appels-offres/${aoId}/reponses`);
    setSelected({ aoId, reponses: data.data });
  }

  async function setStatut(reponseId, statut) {
    try {
      await api.patch(`/appels-offres/reponses/${reponseId}`, { statut });
      toast.success('Mis à jour');
      await loadReponses(selected.aoId);
      qc.invalidateQueries({ queryKey: ['mes-ao'] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Mes appels d&apos;offres</h1>
      <Link to="/dashboard/mes-reponses" className="mt-2 inline-block text-sm font-bold text-bleu">
        Voir mes réponses →
      </Link>

      <div className="mt-8 space-y-4">
        {aos.map((ao) => (
          <div key={ao._id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-extrabold">{ao.titre}</h2>
              <span className="text-xs font-extrabold capitalize">
                {ao.statut} · {ao.nbReponses} réponses
              </span>
            </div>
            <button
              type="button"
              className="btn-line mt-3 !px-4 !py-2 text-sm"
              onClick={() => loadReponses(ao._id)}
            >
              Voir les réponses
            </button>
            {selected?.aoId === ao._id && (
              <div className="mt-4 space-y-3 border-t border-filet pt-4">
                {selected.reponses.length === 0 && (
                  <p className="text-sm text-black/55">Aucune réponse.</p>
                )}
                {selected.reponses.map((r) => (
                  <div key={r._id} className="rounded-2xl bg-fond-doux p-4 text-sm">
                    <div className="font-bold">
                      {r.membreId?.entreprise || 'Membre'} — {formatFcfa(r.montant)} · {r.delaiJours}{' '}
                      j
                    </div>
                    <p className="mt-1 text-black/65">{r.memoireTechnique}</p>
                    <p className="mt-1 text-xs font-extrabold uppercase">{r.statut}</p>
                    {ao.statut === 'ouvert' && r.statut !== 'retenue' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-line !px-3 !py-1.5 text-xs"
                          onClick={() => setStatut(r._id, 'en_etude')}
                        >
                          Étudier
                        </button>
                        <button
                          type="button"
                          className="btn-orange !px-3 !py-1.5 text-xs"
                          onClick={() => setStatut(r._id, 'retenue')}
                        >
                          Retenir
                        </button>
                        <button
                          type="button"
                          className="btn-line !px-3 !py-1.5 text-xs"
                          onClick={() => setStatut(r._id, 'non_retenue')}
                        >
                          Écarter
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
