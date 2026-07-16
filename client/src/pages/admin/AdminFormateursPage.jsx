import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { EmptyState, Field, PageHeader, SectionCard, StatusBadge } from '../../components/ui/PageKit';
import { Icon } from '../../components/ui/icons';

const LEVELS = ['bronze', 'argent', 'or'];
const idOf = (item) => item?.id || item?._id;
const empty = {
  email: '',
  prenom: '',
  nom: '',
  telephone: '',
  specialite: '',
  bio: '',
  niveauxLabels: ['bronze'],
};

export default function AdminFormateursPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [saving, setSaving] = useState(false);
  const { data: trainers = [] } = useQuery({
    queryKey: ['admin-formateurs'],
    queryFn: async () => (await api.get('/admin/formateurs')).data.data,
  });

  function toggleLevel(level) {
    setEditing((current) => ({
      ...current,
      niveauxLabels: current.niveauxLabels.includes(level)
        ? current.niveauxLabels.filter((item) => item !== level)
        : [...current.niveauxLabels, level],
    }));
  }

  async function save(event) {
    event.preventDefault();
    if (!editing.niveauxLabels.length) return toast.error('Choisissez au moins un niveau');
    setSaving(true);
    try {
      if (idOf(editing)) {
        await api.patch(`/admin/formateurs/${idOf(editing)}`, editing);
        toast.success('Affectations mises à jour');
      } else {
        const { data } = await api.post('/admin/formateurs', editing);
        setCredentials({
          email: data.data.formateur.email,
          password: data.data.temporaryPassword,
        });
        toast.success('Compte formateur créé');
      }
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-formateurs'] });
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(trainer) {
    await api.patch(`/admin/formateurs/${idOf(trainer)}`, {
      actif: trainer.statut !== 'actif',
    });
    qc.invalidateQueries({ queryKey: ['admin-formateurs'] });
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        eyebrow="Académie & labellisation"
        title="Équipe de formateurs"
        description="Créez les accès, définissez les spécialités et affectez précisément chaque formateur aux parcours Bronze, Argent ou Or."
        actions={<button className="btn-orange" type="button" onClick={() => setEditing({ ...empty })}>Créer un compte</button>}
        stats={[
          { label: 'Formateurs', value: trainers.length },
          { label: 'Actifs', value: trainers.filter((item) => item.statut === 'actif').length },
          { label: 'Niveaux couverts', value: new Set(trainers.flatMap((item) => item.formateur?.niveauxLabels || [])).size },
        ]}
      />

      {credentials && (
        <section className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Accès temporaire généré</p>
              <p className="mt-2 font-bold">{credentials.email}</p>
              <code className="mt-2 inline-block rounded-xl bg-white px-3 py-2 text-sm font-extrabold">{credentials.password}</code>
              <p className="mt-2 text-xs text-emerald-800">À transmettre de façon sécurisée. Le formateur pourra modifier son mot de passe.</p>
            </div>
            <button type="button" className="btn-line btn-sm" onClick={() => navigator.clipboard.writeText(`${credentials.email}\n${credentials.password}`)}>Copier les accès</button>
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {trainers.map((trainer) => (
          <article key={idOf(trainer)} className="card card-hover overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-bleu via-[#4ca5d8] to-orange" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-13 w-13 place-items-center rounded-2xl bg-ink text-lg font-extrabold text-white">
                  {(trainer.prenom?.[0] || 'F') + (trainer.nom?.[0] || '')}
                </div>
                <StatusBadge value={trainer.statut} />
              </div>
              <h2 className="mt-5 font-display text-xl font-extrabold">{trainer.prenom} {trainer.nom}</h2>
              <p className="mt-1 text-sm font-semibold text-bleu">{trainer.formateur?.specialite}</p>
              <p className="mt-1 truncate text-xs text-gris">{trainer.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(trainer.formateur?.niveauxLabels || []).map((level) => <span key={level} className="chip-orange capitalize">{level}</span>)}
              </div>
              <div className="mt-5 flex gap-2 border-t border-filet pt-4">
                <button type="button" className="btn-line btn-sm flex-1" onClick={() => setEditing({
                  ...trainer,
                  niveauxLabels: trainer.formateur?.niveauxLabels || [],
                  specialite: trainer.formateur?.specialite || '',
                  bio: trainer.formateur?.bio || '',
                })}>Configurer</button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => toggleActive(trainer)}>{trainer.statut === 'actif' ? 'Suspendre' : 'Activer'}</button>
              </div>
            </div>
          </article>
        ))}
        {!trainers.length && <div className="md:col-span-2 xl:col-span-3"><EmptyState title="Aucun formateur" description="Créez le premier compte pour commencer à structurer les parcours de labellisation." icon="◇" /></div>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/55 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="mx-auto my-6 w-full max-w-2xl rounded-[30px] bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-start justify-between">
              <div><p className="eyebrow">Compte professionnel</p><h2 className="font-display text-2xl font-extrabold">{idOf(editing) ? 'Configurer le formateur' : 'Nouveau formateur'}</h2></div>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-fond-doux" onClick={() => setEditing(null)}>×</button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Prénom"><input className="input" required value={editing.prenom} onChange={(e) => setEditing({ ...editing, prenom: e.target.value })} /></Field>
              <Field label="Nom"><input className="input" required value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} /></Field>
              {!idOf(editing) && <Field label="E-mail"><input className="input" type="email" required value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>}
              <Field label="Téléphone"><input className="input" value={editing.telephone || ''} onChange={(e) => setEditing({ ...editing, telephone: e.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="Spécialité"><input className="input" required placeholder="Ex. Qualité, sécurité et conformité BTP" value={editing.specialite} onChange={(e) => setEditing({ ...editing, specialite: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Présentation"><textarea className="input min-h-24" value={editing.bio || ''} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} /></Field></div>
            </div>
            <div className="mt-5">
              <p className="label">Affectations de labellisation</p>
              <div className="grid grid-cols-3 gap-3">
                {LEVELS.map((level) => {
                  const active = editing.niveauxLabels.includes(level);
                  return <button key={level} type="button" onClick={() => toggleLevel(level)} className={`rounded-2xl border-2 p-4 text-center font-extrabold capitalize transition ${active ? 'border-orange bg-orange-soft text-orange-dark' : 'border-filet text-gris hover:border-bleu/30'}`}>{Icon.badge({ className: 'mx-auto mb-2 h-5 w-5' })}{level}</button>;
                })}
              </div>
            </div>
            <div className="mt-7 flex justify-end gap-3"><button type="button" className="btn-line" onClick={() => setEditing(null)}>Annuler</button><button type="submit" className="btn-orange" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer le compte'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
