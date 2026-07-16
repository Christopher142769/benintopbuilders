import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { DEPARTEMENTS, METIERS, formatFcfa } from '../lib/constants';
import { Icon } from '../components/ui/icons';
import { PageHeader } from '../components/ui/PageKit';

const Pin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
);

export default function AppelsOffresPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [categorie, setCategorie] = useState('');
  const [departement, setDepartement] = useState('');
  const [showPublish, setShowPublish] = useState(false);
  const [upsell, setUpsell] = useState(false);
  const [reponseAO, setReponseAO] = useState(null);
  const [dossierReponse, setDossierReponse] = useState(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['aos', categorie, departement, accessToken],
    queryFn: async () => {
      const { data } = await api.get('/appels-offres', {
        params: { categorie: categorie || undefined, departement: departement || undefined, statut: 'ouvert' },
      });
      return data.data;
    },
  });

  const publishForm = useForm({
    defaultValues: { titre: '', description: '', categorie: 'maconnerie', departement: 'Littoral', ville: '', surDevis: true, dateCloture: '' },
  });
  const reponseForm = useForm({ defaultValues: { montant: '', delaiJours: '', memoireTechnique: '' } });

  async function onPublish(values) {
    try {
      await api.post('/appels-offres', values);
      toast.success("Appel d'offres publié");
      setShowPublish(false);
      publishForm.reset();
      qc.invalidateQueries({ queryKey: ['aos'] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Publication impossible');
    }
  }

  async function onRepondre(values) {
    try {
      const payload = new FormData();
      payload.append('montant', Number(values.montant));
      payload.append('delaiJours', Number(values.delaiJours));
      payload.append('memoireTechnique', values.memoireTechnique);
      if (dossierReponse) payload.append('dossier', dossierReponse);
      await api.post(`/appels-offres/${reponseAO._id}/reponses`, payload);
      toast.success('Réponse déposée');
      setReponseAO(null);
      setDossierReponse(null);
      qc.invalidateQueries({ queryKey: ['aos'] });
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'QUOTA_ATTEINT') setUpsell(true);
      toast.error(err.response?.data?.error?.message || 'Échec');
    }
  }

  const filtered = useMemo(() => list, [list]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Marché des besoins"
        title="Les opportunités qui font avancer votre activité."
        description="Explorez les besoins qualifiés, filtrez par métier et déposez des candidatures directement depuis votre espace."
        actions={user?.statut === 'actif' && user?.palier !== 'decouverte' ? (
          <button type="button" className="btn-orange" onClick={() => setShowPublish(true)}>
            {Icon.doc({ className: 'h-4 w-4' })} Publier un besoin
          </button>
        ) : user?.statut === 'actif' ? (
          <Link to="/dashboard/adhesion" className="btn-line btn-sm">Passer à Standard</Link>
        ) : null}
        stats={[
          { label: 'Opportunités', value: filtered.length },
          { label: 'Votre formule', value: user?.palier || 'Visiteur' },
          { label: 'Accès Premium', value: user?.palier === 'premium' ? 'Anticipé 24 h' : 'Standard' },
        ]}
      />

      {/* Filtres */}
      <div className="card p-4 md:p-5">
        <div className="flex flex-wrap gap-2">
          {METIERS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setCategorie(categorie === m.value ? '' : m.value)}
              className={`rounded-pill border px-3.5 py-1.5 text-xs font-extrabold transition ${
                categorie === m.value ? 'border-bleu bg-bleu text-white' : 'border-filet bg-white text-ink hover:border-bleu'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="mt-3 border-t border-filet pt-4">
          <select value={departement} onChange={(e) => setDepartement(e.target.value)} className="input !w-auto !py-2 !text-sm !font-bold">
            <option value="">Tous départements</option>
            {DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading && <div className="card h-28 animate-pulse bg-fond-doux" />}
        {!isLoading && filtered.length === 0 && (
          <div className="card flex flex-col items-center p-12 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-bleu-soft text-bleu">{Icon.doc({ className: 'h-8 w-8' })}</span>
            <p className="mt-5 text-xl font-extrabold">Aucun appel d&apos;offres pour le moment</p>
            <p className="mt-2 max-w-sm text-sm text-gris">Les besoins publiés par les maîtres d&apos;ouvrage apparaîtront ici.</p>
          </div>
        )}
        {filtered.map((ao) => (
          <article key={ao._id} className="card card-hover p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold">{ao.titre}</h2>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gris">
                  <span className="inline-flex items-center gap-1.5"><Pin />{ao.ville || ao.departement}</span>
                  <span className="chip capitalize">{ao.categorie}</span>
                  {ao.clotureBientot && <span className="chip-orange">Clôture bientôt</span>}
                </p>
              </div>
              <span className={ao.statut === 'ouvert' ? 'chip-green capitalize' : 'chip capitalize'}>{ao.statut}</span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-ink/70">{ao.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {user?.statut === 'actif' && ao.statut === 'ouvert' && (
                <button type="button" className="btn-ink btn-sm" onClick={() => setReponseAO(ao)}>Répondre</button>
              )}
              {!user && <Link to="/connexion" className="btn-line btn-sm">Connexion pour répondre</Link>}
            </div>
          </article>
        ))}
      </div>

      {/* Modale publier */}
      {showPublish && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center">
          <form onSubmit={publishForm.handleSubmit(onPublish)} className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 md:p-8">
            <h3 className="text-2xl font-extrabold">Publier un besoin</h3>
            <p className="mt-1 text-sm text-gris">Décrivez votre projet pour recevoir des réponses qualifiées.</p>
            <div className="mt-6 space-y-4">
              <div><label className="label">Titre</label><input placeholder="Ex. Construction d'un duplex R+1" className="input" {...publishForm.register('titre', { required: true })} /></div>
              <div><label className="label">Description</label><textarea placeholder="Détaillez le besoin, le budget, les contraintes…" rows={4} className="input" {...publishForm.register('description', { required: true })} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label">Catégorie</label><select className="input" {...publishForm.register('categorie')}>{METIERS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
                <div><label className="label">Département</label><select className="input" {...publishForm.register('departement')}>{DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
              </div>
              <div><label className="label">Date de clôture</label><input type="date" className="input" {...publishForm.register('dateCloture', { required: true })} /></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" className="btn-line" onClick={() => setShowPublish(false)}>Annuler</button>
              <button type="submit" className="btn-orange flex-1">Publier</button>
            </div>
          </form>
        </div>
      )}

      {/* Panneau répondre */}
      {reponseAO && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-sm">
          <form onSubmit={reponseForm.handleSubmit(onRepondre)} className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-lift md:p-8">
            <h3 className="text-2xl font-extrabold">Déposer une réponse</h3>
            <p className="mt-1 text-sm text-gris">{reponseAO.titre}</p>
            <div className="mt-6 space-y-4">
              <div><label className="label">Montant (FCFA)</label><input type="number" placeholder="0" className="input" {...reponseForm.register('montant', { required: true })} /></div>
              <div><label className="label">Délai (jours)</label><input type="number" placeholder="0" className="input" {...reponseForm.register('delaiJours', { required: true })} /></div>
              <div><label className="label">Mémoire technique</label><textarea rows={6} placeholder="Votre approche, références, planning…" className="input" {...reponseForm.register('memoireTechnique', { required: true })} /></div>
              <div>
                <label className="label">Dossier de candidature</label>
                <input type="file" accept=".pdf,.doc,.docx" className="input file:mr-3 file:rounded-pill file:border-0 file:bg-ink file:px-3 file:py-2 file:text-xs file:font-bold file:text-white" onChange={(event) => setDossierReponse(event.target.files?.[0] || null)} />
                <p className="field-hint">PDF, DOC ou DOCX — références, méthodologie et pièces utiles.</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" className="btn-line" onClick={() => setReponseAO(null)}>Fermer</button>
              <button type="submit" className="btn-orange flex-1">Envoyer</button>
            </div>
          </form>
        </div>
      )}

      {/* Upsell quota */}
      {upsell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="card max-w-md p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-soft text-orange">{Icon.card({ className: 'h-7 w-7' })}</span>
            <h3 className="mt-4 text-2xl font-extrabold">Quota atteint</h3>
            <p className="mt-3 text-sm text-gris">
              Le palier Découverte est limité à 2 réponses / mois. Passez Standard ({formatFcfa(200000)}) ou Premium ({formatFcfa(500000)}).
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/inscription?etape=paiement" className="btn-orange" onClick={() => setUpsell(false)}>Voir les paliers</Link>
              <button type="button" className="btn-line" onClick={() => setUpsell(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
