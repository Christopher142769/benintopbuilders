import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';
import { Icon } from '../components/ui/icons';
import { PageHeader } from '../components/ui/PageKit';

const REP_CHIP = {
  retenue: 'chip-green',
  non_retenue: 'chip',
  en_etude: 'chip-orange',
};

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
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="AO reçus"
        title="Pilotez les réponses à vos besoins."
        description="Comparez les propositions, placez-les à l’étude et retenez le partenaire le plus adapté."
        actions={<Link to="/dashboard/appels-offres" className="btn-orange btn-sm">Publier un besoin</Link>}
        stats={[
          { label: 'Appels publiés', value: aos.length },
          { label: 'Ouverts', value: aos.filter((ao) => ao.statut === 'ouvert').length },
          { label: 'Réponses reçues', value: aos.reduce((sum, ao) => sum + (ao.nbReponses || 0), 0) },
        ]}
      />

      <div className="space-y-4">
        {aos.length === 0 && (
          <div className="card flex flex-col items-center p-12 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-bleu-soft text-bleu">{Icon.folder({ className: 'h-8 w-8' })}</span>
            <p className="mt-5 text-xl font-extrabold">Aucun appel d&apos;offres publié</p>
            <p className="mt-2 max-w-sm text-sm text-gris">Publiez un besoin depuis la page Appels d&apos;offres pour recevoir des réponses.</p>
          </div>
        )}
        {aos.map((ao) => (
          <div key={ao.id || ao._id} className="card p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-extrabold">{ao.titre}</h3>
              <div className="flex items-center gap-2">
                <span className={ao.statut === 'ouvert' ? 'chip-green capitalize' : 'chip capitalize'}>{ao.statut}</span>
                <span className="chip">{ao.nbReponses} réponses</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-line btn-sm mt-3"
              onClick={() => (selected?.aoId === (ao.id || ao._id) ? setSelected(null) : loadReponses(ao.id || ao._id))}
            >
              {selected?.aoId === (ao.id || ao._id) ? 'Masquer' : 'Voir les réponses'}
            </button>
            {selected?.aoId === (ao.id || ao._id) && (
              <div className="mt-4 space-y-3 border-t border-filet pt-4">
                {selected.reponses.length === 0 && <p className="text-sm text-gris">Aucune réponse pour l&apos;instant.</p>}
                {selected.reponses.map((r) => (
                  <div key={r.id || r._id} className="rounded-2xl border border-filet bg-fond-doux p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold">
                        {r.membreId?.entreprise || 'Membre'} — <span className="text-bleu">{formatFcfa(r.montant)}</span> · {r.delaiJours} j
                      </div>
                      <span className={`${REP_CHIP[r.statut] || 'chip'} capitalize`}>{r.statut.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="mt-2 text-ink/70">{r.memoireTechnique}</p>
                    {r.piecesJointes?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.piecesJointes.map((url, index) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" className="chip">
                            Dossier {index + 1} ↗
                          </a>
                        ))}
                      </div>
                    )}
                    {ao.statut === 'ouvert' && r.statut !== 'retenue' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className="btn-line btn-sm" onClick={() => setStatut(r.id || r._id, 'en_etude')}>Étudier</button>
                        <button type="button" className="btn-orange btn-sm" onClick={() => setStatut(r.id || r._id, 'retenue')}>Retenir</button>
                        <button type="button" className="btn-line btn-sm" onClick={() => setStatut(r.id || r._id, 'non_retenue')}>Écarter</button>
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
