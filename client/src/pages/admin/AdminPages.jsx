import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../lib/api';
import { formatFcfa } from '../../lib/constants';
import toast from 'react-hot-toast';
import { EmptyState, Field, PageHeader, SectionCard, StatusBadge } from '../../components/ui/PageKit';
import { Icon } from '../../components/ui/icons';

const idOf = (item) => item?.id || item?._id;

const FIELD_TYPES = [
  ['text', 'Texte court'],
  ['textarea', 'Texte long'],
  ['number', 'Nombre'],
  ['email', 'E-mail'],
  ['tel', 'Téléphone'],
  ['url', 'Lien URL'],
  ['date', 'Date'],
  ['select', 'Liste déroulante'],
  ['multiselect', 'Choix multiple'],
  ['checkbox', 'Case à cocher'],
  ['file', 'Fichier'],
];

const emptyField = () => ({
  key: `champ_${Date.now()}`,
  label: 'Nouveau champ',
  type: 'text',
  description: '',
  placeholder: '',
  required: false,
  options: [],
  accept: 'image/*,.pdf,.doc,.docx',
  ordre: 0,
});

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
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        eyebrow="Qualité & conformité"
        title="Dossiers de labellisation"
        description="Examinez les pièces, contrôlez les prérequis de formation et conduisez chaque demande jusqu’à la décision finale."
        stats={[
          { label: 'Dossiers', value: dossiers.length },
          { label: 'Éligibles formation', value: dossiers.filter((item) => item.eligibleFormation).length },
          { label: 'À examiner', value: dossiers.filter((item) => ['soumis', 'en_examen'].includes(item.statut)).length },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {dossiers.map((d) => (
          <article key={idOf(d)} className="card card-hover overflow-hidden text-sm">
            <div className="h-1.5 bg-gradient-to-r from-bleu to-orange" />
            <div className="p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{d.membreId?.entreprise || d.membreId?.email}</strong>
              <div className="flex items-center gap-2">
                <span className="chip capitalize">{d.niveauDemande}</span>
                <StatusBadge value={d.statut} />
              </div>
            </div>
            <div className="mt-4 grid gap-2 rounded-2xl bg-fond-doux p-4 sm:grid-cols-2">
              {(d.reponses || []).map((response) => (
                <div key={response._id || response.key}>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-gris">{response.label || response.key}</span>
                  {response.fichierUrl ? (
                    <a className="mt-1 block font-bold text-bleu" href={response.fichierUrl} target="_blank" rel="noreferrer">
                      Ouvrir {response.nomOriginal || 'le fichier'} ↗
                    </a>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap font-medium">
                      {Array.isArray(response.valeur) ? response.valeur.join(', ') : String(response.valeur ?? '—')}
                    </p>
                  )}
                </div>
              ))}
              {(!d.reponses || d.reponses.length === 0) && <p className="text-gris">Dossier historique sans réponses dynamiques.</p>}
            </div>
            <p className="mt-3 text-xs font-bold text-gris">
              Formations : {d.eligibleFormation ? 'toutes validées' : 'validation(s) en attente'}
              {d.fraisInclusAbonnement ? ' · frais inclus dans l’abonnement' : ' · audit payant'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['en_examen', 'pieces_manquantes', 'visite_programmee', 'valide', 'rejete'].map((to) => (
                <button
                  key={to}
                  type="button"
                  className="btn-line !px-2 !py-1 text-[10px]"
                  onClick={() => transition(idOf(d), to)}
                >
                  → {to}
                </button>
              ))}
            </div>
            </div>
          </article>
        ))}
        {!dossiers.length && <div className="xl:col-span-2"><EmptyState title="Aucun dossier à traiter" description="Les nouvelles demandes de labellisation apparaîtront dans cette file." icon="✓" /></div>}
      </div>
    </div>
  );
}

export function AdminLabelFormsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const { data: forms = [] } = useQuery({
    queryKey: ['admin-label-forms'],
    queryFn: async () => (await api.get('/admin/label-formulaires')).data.data,
  });
  const { data: formations = [] } = useQuery({
    queryKey: ['formations'],
    queryFn: async () => (await api.get('/formations')).data.data,
  });

  function newForm() {
    setEditing({
      niveau: 'bronze',
      titre: 'Dossier de labellisation Bronze',
      description: '',
      actif: true,
      champs: [emptyField()],
      formationsRequises: [],
    });
  }

  function editForm(form) {
    setEditing({
      ...form,
      formationsRequises: (form.formationsRequises || []).map((formation) =>
        typeof formation === 'string' ? formation : idOf(formation)
      ),
      champs: form.champs.map((field) => ({
        ...field,
        options: field.options || [],
      })),
    });
  }

  function updateField(index, patch) {
    setEditing((current) => ({
      ...current,
      champs: current.champs.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        ...editing,
        champs: editing.champs.map((field, index) => ({ ...field, ordre: index })),
      };
      if (idOf(editing)) {
        await api.patch(`/admin/label-formulaires/${idOf(editing)}`, payload);
      } else {
        await api.post('/admin/label-formulaires', payload);
      }
      toast.success(idOf(editing) ? 'Formulaire mis à jour' : 'Formulaire créé');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-label-forms'] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  async function remove(form) {
    if (!window.confirm(`Supprimer le formulaire ${form.niveau} ?`)) return;
    await api.delete(`/admin/label-formulaires/${idOf(form)}`);
    toast.success('Formulaire supprimé');
    qc.invalidateQueries({ queryKey: ['admin-label-forms'] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Qualité & conformité"
        title="Formulaires de labellisation"
        description="Configurez les informations, documents et formations exigés pour chaque niveau."
        actions={<button type="button" className="btn-orange btn-sm" onClick={newForm}>Nouveau formulaire</button>}
        stats={[
          { label: 'Configurés', value: forms.length },
          { label: 'Champs actifs', value: forms.reduce((sum, form) => sum + form.champs.length, 0) },
          { label: 'Formations', value: formations.length },
        ]}
      />

      {!editing && (
        <div className="grid gap-4 lg:grid-cols-3">
          {forms.map((form) => (
            <article key={idOf(form)} className="card overflow-hidden">
              <div className="bg-gradient-to-br from-bleu-soft to-white p-6">
                <div className="flex items-center justify-between">
                  <span className="chip-orange capitalize">{form.niveau}</span>
                  <StatusBadge value={form.actif ? 'actif' : 'inactif'} />
                </div>
                <h2 className="mt-5 font-display text-xl font-extrabold">{form.titre}</h2>
                <p className="mt-2 min-h-10 text-sm leading-5 text-gris">{form.description}</p>
              </div>
              <div className="p-5">
                <div className="flex gap-6 text-sm">
                  <div><strong className="text-xl">{form.champs.length}</strong><br /><span className="text-gris">champs</span></div>
                  <div><strong className="text-xl">{form.formationsRequises?.length || 0}</strong><br /><span className="text-gris">formations</span></div>
                  <div><strong className="text-xl">v{form.version}</strong><br /><span className="text-gris">version</span></div>
                </div>
                <div className="mt-5 flex gap-2">
                  <button type="button" className="btn-line btn-sm flex-1" onClick={() => editForm(form)}>Modifier</button>
                  <button type="button" className="btn-ghost btn-sm text-orange" onClick={() => remove(form)}>Supprimer</button>
                </div>
              </div>
            </article>
          ))}
          {forms.length === 0 && (
            <div className="lg:col-span-3">
              <EmptyState
                title="Aucun formulaire configuré"
                description="Créez les formulaires Bronze, Argent et Or avant d’ouvrir les demandes."
                action={<button type="button" className="btn-orange btn-sm" onClick={newForm}>Créer le premier</button>}
              />
            </div>
          )}
        </div>
      )}

      {editing && (
        <SectionCard
          title={idOf(editing) ? `Modifier ${editing.niveau}` : 'Nouveau formulaire'}
          description="Les modifications créent une nouvelle version sans altérer les dossiers déjà déposés."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Niveau">
              <select className="input" value={editing.niveau} onChange={(event) => setEditing({ ...editing, niveau: event.target.value })} disabled={Boolean(idOf(editing))}>
                {['bronze', 'argent', 'or'].map((niveau) => <option key={niveau} value={niveau}>{niveau}</option>)}
              </select>
            </Field>
            <Field label="Titre">
              <input className="input" value={editing.titre} onChange={(event) => setEditing({ ...editing, titre: event.target.value })} />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea className="input" rows={3} value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
            </Field>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-extrabold">Champs attendus</h3>
              <p className="mt-1 text-sm text-gris">Définissez leur type, obligation et aide contextuelle.</p>
            </div>
            <button type="button" className="btn-line btn-sm" onClick={() => setEditing({ ...editing, champs: [...editing.champs, emptyField()] })}>Ajouter un champ</button>
          </div>

          <div className="mt-4 space-y-3">
            {editing.champs.map((field, index) => (
              <div key={field._id || `${field.key}-${index}`} className="rounded-[22px] border border-filet bg-fond-doux/50 p-4">
                <div className="grid gap-3 md:grid-cols-12">
                  <Field label="Libellé" className="md:col-span-4">
                    <input className="input" value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} />
                  </Field>
                  <Field label="Identifiant" className="md:col-span-3">
                    <input className="input" value={field.key} onChange={(event) => updateField(index, { key: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} />
                  </Field>
                  <Field label="Type" className="md:col-span-3">
                    <select className="input" value={field.type} onChange={(event) => updateField(index, { type: event.target.value })}>
                      {FIELD_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                  <div className="flex items-end gap-3 md:col-span-2">
                    <label className="mb-3 flex items-center gap-2 text-xs font-bold">
                      <input type="checkbox" checked={field.required} onChange={(event) => updateField(index, { required: event.target.checked })} />
                      Requis
                    </label>
                    <button type="button" className="mb-1 text-xl text-orange" aria-label="Supprimer le champ" onClick={() => setEditing({ ...editing, champs: editing.champs.filter((_, i) => i !== index) })}>×</button>
                  </div>
                  <Field label="Aide / consigne" className="md:col-span-6">
                    <input className="input" value={field.description} onChange={(event) => updateField(index, { description: event.target.value })} />
                  </Field>
                  {['select', 'multiselect'].includes(field.type) && (
                    <Field label="Options (séparées par des virgules)" className="md:col-span-6">
                      <input className="input" value={field.options.join(', ')} onChange={(event) => updateField(index, { options: event.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} />
                    </Field>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="font-display text-xl font-extrabold">Formations obligatoires</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {formations.map((formation) => {
                const formationId = idOf(formation);
                const selected = editing.formationsRequises.includes(formationId);
                return (
                  <label key={formationId} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${selected ? 'border-bleu bg-bleu-soft' : 'border-filet'}`}>
                    <input
                      type="checkbox"
                      className="mt-1 accent-bleu"
                      checked={selected}
                      onChange={() => setEditing({
                        ...editing,
                        formationsRequises: selected
                          ? editing.formationsRequises.filter((id) => id !== formationId)
                          : [...editing.formationsRequises, formationId],
                      })}
                    />
                    <span><strong>{formation.titre}</strong><br /><span className="text-xs text-gris">{formation.modalite} · {formation.dureeHeures} h</span></span>
                  </label>
                );
              })}
              {formations.length === 0 && <p className="text-sm text-gris">Créez d’abord les formations nécessaires.</p>}
            </div>
          </div>

          <div className="mt-8 flex gap-3 border-t border-filet pt-5">
            <button type="button" className="btn-line" onClick={() => setEditing(null)}>Annuler</button>
            <button type="button" className="btn-orange" disabled={saving || editing.champs.length === 0} onClick={save}>
              {saving ? 'Enregistrement…' : 'Enregistrer le formulaire'}
            </button>
          </div>
        </SectionCard>
      )}
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
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        eyebrow="Communauté BTB"
        title="Membres de la plateforme"
        description="Supervisez les adhésions, les profils, les formules et l’état des comptes professionnels."
        stats={[
          { label: 'Comptes', value: membres.length },
          { label: 'Actifs', value: membres.filter((item) => item.statut === 'actif').length },
          { label: 'Suspendus', value: membres.filter((item) => item.statut === 'suspendu').length },
        ]}
      />
      <div className="grid gap-3">
        {membres.map((m) => (
          <article key={idOf(m)} className="card flex flex-wrap items-center gap-4 p-4 text-sm transition hover:border-bleu/20 hover:shadow-soft">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-bleu to-ink font-extrabold text-white">
              {(m.entreprise || m.prenom || m.email || 'M').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block truncate">{m.entreprise || `${m.prenom || ''} ${m.nom || ''}`}</strong>
              <div className="mt-1 truncate text-xs text-black/50">{m.email} · {m.profilType || 'profil membre'}</div>
            </div>
            <span className="chip capitalize">{m.palier}</span>
            <StatusBadge value={m.statut} />
            <div className="flex gap-2">
              {m.statut !== 'suspendu' ? (
                <button type="button" className="btn-line !px-3 !py-1.5 text-xs" onClick={() => suspendre(idOf(m))}>
                  Suspendre
                </button>
              ) : (
                <button type="button" className="btn-orange !px-3 !py-1.5 text-xs" onClick={() => reactiver(idOf(m))}>
                  Réactiver
                </button>
              )}
            </div>
          </article>
        ))}
        {!membres.length && <EmptyState title="Aucun membre" description="Les nouveaux inscrits apparaîtront ici." />}
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
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        eyebrow="Confiance & intégrité"
        title="Centre de modération"
        description="Traitez les avis, détectez les anomalies du Marketplace et identifiez les appels d’offres potentiellement dupliqués."
        stats={[
          { label: 'Avis en attente', value: avis.length },
          { label: 'Prix à vérifier', value: prix.length },
          { label: 'Doublons AO', value: doublons.length },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard eyebrow="Réputation" title="Avis à modérer">
        <div className="space-y-3">
          {avis.map((a) => (
            <div key={idOf(a)} className="rounded-2xl border border-filet p-4 text-sm">
              <div className="flex items-center justify-between"><strong className="text-orange">{'★'.repeat(a.note)}</strong><StatusBadge value={a.statut} /></div>
              <p className="mt-3 leading-6">{a.commentaire || 'Avis sans commentaire'}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn-orange !px-3 !py-1 text-xs" onClick={async () => {
                  await api.patch(`/admin/moderation/avis/${idOf(a)}`, { publier: true });
                  qc.invalidateQueries({ queryKey: ['admin-avis'] });
                }}>Publier</button>
                <button type="button" className="btn-line !px-3 !py-1 text-xs" onClick={async () => {
                  await api.patch(`/admin/moderation/avis/${idOf(a)}`, { publier: false });
                  qc.invalidateQueries({ queryKey: ['admin-avis'] });
                }}>Rejeter</button>
              </div>
            </div>
          ))}
          {!avis.length && <EmptyState title="File à jour" description="Aucun avis ne nécessite de décision." icon="✓" />}
        </div>
        </SectionCard>
        <SectionCard eyebrow="Marketplace" title="Prix anormaux">
        <p className="-mt-3 mb-4 text-xs text-gris">Produits sous 30 % de la médiane de leur catégorie.</p>
        <div className="space-y-2 text-sm">
          {prix.map((p) => (
            <div key={idOf(p)} className="flex items-center justify-between gap-3 rounded-2xl bg-orange-soft p-4"><strong>{p.nom}</strong><span className="text-right text-xs font-bold text-orange-dark">{formatFcfa(p.prixUnitaire)}<br /><small className="text-gris">médiane {formatFcfa(p.mediane)}</small></span></div>
          ))}
          {!prix.length && <EmptyState title="Aucune anomalie tarifaire" description="Les prix du catalogue sont cohérents." icon="✓" />}
        </div>
        </SectionCard>
      </div>
      <SectionCard eyebrow="Opportunités" title="Appels d’offres en doublon">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          {doublons.map((d) => (
            <div key={JSON.stringify(d._id)} className="flex items-center justify-between rounded-2xl border border-filet p-4"><strong>{d._id?.titre}</strong><span className="chip-orange">× {d.count}</span></div>
          ))}
          {!doublons.length && <div className="md:col-span-2"><EmptyState title="Aucun doublon détecté" description="La file des appels d’offres est saine." icon="✓" /></div>}
        </div>
      </SectionCard>
    </div>
  );
}

export function AdminAuditPage() {
  const { data: logs = [] } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: async () => (await api.get('/admin/audit')).data.data,
  });
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        eyebrow="Sécurité & traçabilité"
        title="Journal d’audit"
        description="Toutes les décisions sensibles du back-office sont conservées avec leur auteur, leur ressource et leur horodatage."
        stats={[
          { label: 'Événements affichés', value: logs.length },
          { label: 'Traçabilité', value: 'Active' },
          { label: 'Rétention', value: '100 derniers' },
        ]}
      />
      <div className="overflow-hidden rounded-[28px] border border-filet bg-white shadow-soft">
        {logs.map((l) => (
          <div key={idOf(l)} className="flex items-center gap-4 border-b border-filet p-4 text-xs last:border-0 hover:bg-fond-doux/50">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white">{Icon.shield({ className: 'h-4 w-4' })}</span>
            <div className="min-w-0 flex-1"><strong className="block truncate text-sm">{l.action}</strong><span className="text-gris">{l.ressource}{l.acteurId?.email ? ` · ${l.acteurId.email}` : ''}</span></div>
            <time className="shrink-0 text-right font-bold text-gris">{new Date(l.createdAt).toLocaleDateString('fr-FR')}<br /><span className="font-normal">{new Date(l.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></time>
          </div>
        ))}
        {!logs.length && <div className="p-6"><EmptyState title="Journal vide" description="Les prochaines actions administratives seront tracées ici." /></div>}
      </div>
    </div>
  );
}
