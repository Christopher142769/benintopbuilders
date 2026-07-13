import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { DEPARTEMENTS, METIERS, formatFcfa } from '../lib/constants';

export default function AppelsOffresPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [categorie, setCategorie] = useState('');
  const [departement, setDepartement] = useState('');
  const [showPublish, setShowPublish] = useState(false);
  const [upsell, setUpsell] = useState(false);
  const [reponseAO, setReponseAO] = useState(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['aos', categorie, departement, accessToken],
    queryFn: async () => {
      const { data } = await api.get('/appels-offres', {
        params: {
          categorie: categorie || undefined,
          departement: departement || undefined,
          statut: 'ouvert',
        },
      });
      return data.data;
    },
  });

  const publishForm = useForm({
    defaultValues: {
      titre: '',
      description: '',
      categorie: 'maconnerie',
      departement: 'Littoral',
      ville: '',
      surDevis: true,
      dateCloture: '',
    },
  });

  const reponseForm = useForm({
    defaultValues: { montant: '', delaiJours: '', memoireTechnique: '' },
  });

  async function onPublish(values) {
    try {
      await api.post('/appels-offres', values);
      toast.success('Appel d\'offres publié');
      setShowPublish(false);
      publishForm.reset();
      qc.invalidateQueries({ queryKey: ['aos'] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Publication impossible');
    }
  }

  async function onRepondre(values) {
    try {
      await api.post(`/appels-offres/${reponseAO._id}/reponses`, {
        montant: Number(values.montant),
        delaiJours: Number(values.delaiJours),
        memoireTechnique: values.memoireTechnique,
      });
      toast.success('Réponse déposée');
      setReponseAO(null);
      qc.invalidateQueries({ queryKey: ['aos'] });
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'QUOTA_ATTEINT') setUpsell(true);
      toast.error(err.response?.data?.error?.message || 'Échec');
    }
  }

  const filtered = useMemo(() => list, [list]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Marché des besoins</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Appels d&apos;offres</h1>
          <p className="mt-2 text-black/65">Premium voit les AO 24 h avant. Découverte : 2 réponses / mois.</p>
        </div>
        {user?.statut === 'actif' && (
          <button type="button" className="btn-orange" onClick={() => setShowPublish(true)}>
            Publier un besoin
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {METIERS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setCategorie(categorie === m.value ? '' : m.value)}
            className={`rounded-pill px-3 py-1.5 text-xs font-extrabold ${
              categorie === m.value ? 'bg-bleu text-white' : 'bg-fond-doux'
            }`}
          >
            {m.label}
          </button>
        ))}
        <select
          value={departement}
          onChange={(e) => setDepartement(e.target.value)}
          className="rounded-pill border-[1.5px] border-black/10 px-4 py-2 text-sm font-bold"
        >
          <option value="">Tous départements</option>
          {DEPARTEMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 grid gap-4">
        {isLoading && <div className="card h-24 animate-pulse bg-fond-doux" />}
        {!isLoading && filtered.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-display text-xl font-extrabold">Aucun AO pour ces filtres</p>
          </div>
        )}
        {filtered.map((ao) => (
          <article key={ao._id} className="card p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-extrabold">{ao.titre}</h2>
                <p className="mt-1 text-sm text-black/55">
                  {ao.ville || ao.departement} · {ao.categorie}
                  {ao.clotureBientot && (
                    <span className="ml-2 rounded-pill bg-orange-soft px-2 py-0.5 text-[10px] font-extrabold uppercase text-orange">
                      Clôture bientôt
                    </span>
                  )}
                </p>
              </div>
              <span className="rounded-pill bg-fond-doux px-3 py-1 text-xs font-extrabold capitalize">
                {ao.statut}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-black/70">{ao.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {user?.statut === 'actif' && ao.statut === 'ouvert' && (
                <button type="button" className="btn-ink !px-4 !py-2 text-sm" onClick={() => setReponseAO(ao)}>
                  Répondre
                </button>
              )}
              {!user && (
                <Link to="/connexion" className="btn-line !px-4 !py-2 text-sm">
                  Connexion pour répondre
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {showPublish && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form
            onSubmit={publishForm.handleSubmit(onPublish)}
            className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
          >
            <h3 className="font-display text-2xl font-extrabold">Publier un besoin</h3>
            <div className="mt-4 space-y-3">
              <input placeholder="Titre" className="w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...publishForm.register('titre', { required: true })} />
              <textarea placeholder="Description" rows={4} className="w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...publishForm.register('description', { required: true })} />
              <select className="w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...publishForm.register('categorie')}>
                {METIERS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select className="w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...publishForm.register('departement')}>
                {DEPARTEMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input type="date" className="w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...publishForm.register('dateCloture', { required: true })} />
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" className="btn-line" onClick={() => setShowPublish(false)}>Annuler</button>
              <button type="submit" className="btn-orange">Publier</button>
            </div>
          </form>
        </div>
      )}

      {reponseAO && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/40">
          <form
            onSubmit={reponseForm.handleSubmit(onRepondre)}
            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-lift"
          >
            <h3 className="font-display text-2xl font-extrabold">Déposer une réponse</h3>
            <p className="mt-1 text-sm text-black/60">{reponseAO.titre}</p>
            <div className="mt-6 space-y-3">
              <input type="number" placeholder="Montant (FCFA)" className="w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...reponseForm.register('montant', { required: true })} />
              <input type="number" placeholder="Délai (jours)" className="w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...reponseForm.register('delaiJours', { required: true })} />
              <textarea rows={5} placeholder="Mémoire technique" className="w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...reponseForm.register('memoireTechnique', { required: true })} />
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" className="btn-line" onClick={() => setReponseAO(null)}>Fermer</button>
              <button type="submit" className="btn-orange">Envoyer</button>
            </div>
          </form>
        </div>
      )}

      {upsell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="card max-w-md p-8 text-center">
            <h3 className="font-display text-2xl font-extrabold">Quota atteint</h3>
            <p className="mt-3 text-sm text-black/65">
              Le palier Découverte est limité à 2 réponses / mois. Passez Standard ({formatFcfa(50000)}) ou Premium.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/inscription?etape=paiement" className="btn-orange" onClick={() => setUpsell(false)}>
                Voir les paliers
              </Link>
              <button type="button" className="btn-line" onClick={() => setUpsell(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
