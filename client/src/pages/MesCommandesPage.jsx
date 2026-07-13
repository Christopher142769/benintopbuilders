import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';
import { Link } from 'react-router-dom';

export default function MesCommandesPage() {
  const { data: commandes = [] } = useQuery({
    queryKey: ['mes-commandes'],
    queryFn: async () => (await api.get('/materiaux/commandes')).data.data,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Mes commandes</h1>
      <div className="mt-8 space-y-3">
        {commandes.length === 0 && <div className="card p-8 text-center text-sm text-black/60">Aucune commande.</div>}
        {commandes.map((c) => (
          <div key={c._id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>{formatFcfa(c.total)}</strong>
              <span className="rounded-pill bg-fond-doux px-3 py-1 text-xs font-extrabold capitalize">{c.statut}</span>
            </div>
            <p className="mt-2 text-sm text-black/60">{c.lignes?.length} article(s) · service {formatFcfa(c.fraisService)}</p>
            {c.statut === 'livree' && (
              <Link to={`/dashboard/avis?commande=${c._id}`} className="mt-3 inline-block text-sm font-bold text-orange">
                Noter le fournisseur →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
