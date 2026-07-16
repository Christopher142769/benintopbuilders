import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';
import { Icon } from '../components/ui/icons';
import { PageHeader, StatusBadge } from '../components/ui/PageKit';

export default function MesReponsesPage() {
  const { data: reponses = [] } = useQuery({
    queryKey: ['mes-reponses'],
    queryFn: async () => (await api.get('/appels-offres/mes-reponses')).data.data,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Mes candidatures"
        title="Suivez chaque opportunité."
        description="Retrouvez vos offres, montants, délais et décisions dans une vue claire."
        actions={<Link to="/dashboard/appels-offres" className="btn-orange btn-sm">Trouver une opportunité</Link>}
        stats={[
          { label: 'Candidatures', value: reponses.length },
          { label: 'Retenues', value: reponses.filter((r) => r.statut === 'retenue').length },
          { label: 'À l’étude', value: reponses.filter((r) => r.statut === 'en_etude').length },
        ]}
      />

      <div className="space-y-3">
        {reponses.length === 0 && (
          <div className="card flex flex-col items-center p-12 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-bleu-soft text-bleu">{Icon.send({ className: 'h-8 w-8' })}</span>
            <p className="mt-5 text-xl font-extrabold">Aucune candidature déposée</p>
            <p className="mt-2 max-w-sm text-sm text-gris">Répondez à un appel d&apos;offres pour suivre vos candidatures ici.</p>
            <Link to="/dashboard/appels-offres" className="btn-orange mt-6">Voir les appels d&apos;offres</Link>
          </div>
        )}
        {reponses.map((r) => (
          <div key={r.id || r._id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-bleu-soft text-bleu">{Icon.doc({})}</span>
              <div>
                <div className="text-lg font-extrabold">{r.aoId?.titre || 'Appel d\'offres'}</div>
                <p className="text-sm text-gris"><span className="font-bold text-bleu">{formatFcfa(r.montant)}</span> · {r.delaiJours} jours</p>
              </div>
            </div>
            <StatusBadge value={r.statut} />
          </div>
        ))}
      </div>
    </div>
  );
}
