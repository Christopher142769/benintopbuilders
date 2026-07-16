import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';
import { useAuthStore } from '../store/authStore';
import { EmptyState, Field, PageHeader, SectionCard, StatusBadge } from '../components/ui/PageKit';

const NIVEAUX = [
  { value: 'bronze', price: 75000, desc: 'Fondamentaux vérifiés', color: 'from-orange-100 to-white' },
  { value: 'argent', price: 150000, desc: 'Conformité renforcée', color: 'from-slate-100 to-white' },
  { value: 'or', price: 300000, desc: 'Excellence opérationnelle', color: 'from-amber-100 to-white' },
];

const TIMELINE = [
  'soumis',
  'en_examen',
  'pieces_manquantes',
  'visite_programmee',
  'valide',
  'rejete',
];

export default function LabellisationPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [niveau, setNiveau] = useState('bronze');
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const paidPlan = user?.palier && user.palier !== 'decouverte';

  const { data: dossierData, refetch } = useQuery({
    queryKey: ['mon-dossier'],
    queryFn: async () => (await api.get('/me/dossier')).data.data.dossier,
  });

  const { data: formulaire, isLoading: formLoading } = useQuery({
    queryKey: ['label-formulaire', niveau],
    queryFn: async () =>
      (await api.get(`/me/label-formulaires/${niveau}`)).data.data.formulaire,
  });

  const sortedFields = useMemo(
    () => [...(formulaire?.champs || [])].sort((a, b) => a.ordre - b.ordre),
    [formulaire]
  );

  const checklistOk = useMemo(
    () =>
      sortedFields.every((field) => {
        if (!field.required) return true;
        if (field.type === 'file') return Boolean(files[field.key]);
        const value = values[field.key];
        return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== '';
      }),
    [files, sortedFields, values]
  );

  async function submit() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('niveauDemande', niveau);
      fd.append('valeurs', JSON.stringify(values));
      for (const [k, f] of Object.entries(files)) {
        if (f) fd.append(`field_${k}`, f);
      }
      const { data } = await api.post('/me/dossiers-label', fd);
      toast.success(data.message || 'Dossier déposé');
      await refetch();
      if (data.data.needsPayment && data.data.checkoutUrl) {
        navigate(
          data.data.checkoutUrl.replace(/^https?:\/\/[^/]+/, '') ||
            `/paiement/retour?ref=${data.data.paiement.refInterne}`
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Échec');
    } finally {
      setLoading(false);
    }
  }

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field.key]: value }));
  }

  function renderField(field) {
    if (field.type === 'file') {
      return (
        <Field key={field._id} label={`${field.label}${field.required ? ' *' : ''}`} hint={field.description}>
          <input
            type="file"
            accept={field.accept}
            className="input file:mr-3 file:rounded-pill file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-bold file:text-white"
            onChange={(event) =>
              setFiles((current) => ({
                ...current,
                [field.key]: event.target.files?.[0] || null,
              }))
            }
          />
        </Field>
      );
    }
    if (field.type === 'textarea') {
      return (
        <Field key={field._id} label={`${field.label}${field.required ? ' *' : ''}`} hint={field.description}>
          <textarea
            rows={4}
            className="input resize-y"
            placeholder={field.placeholder}
            value={values[field.key] || ''}
            onChange={(event) => updateValue(field, event.target.value)}
          />
        </Field>
      );
    }
    if (field.type === 'select' || field.type === 'multiselect') {
      return (
        <Field key={field._id} label={`${field.label}${field.required ? ' *' : ''}`} hint={field.description}>
          <select
            className="input"
            multiple={field.type === 'multiselect'}
            value={values[field.key] || (field.type === 'multiselect' ? [] : '')}
            onChange={(event) =>
              updateValue(
                field,
                field.type === 'multiselect'
                  ? Array.from(event.target.selectedOptions, (option) => option.value)
                  : event.target.value
              )
            }
          >
            {field.type === 'select' && <option value="">Sélectionner</option>}
            {field.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
      );
    }
    if (field.type === 'checkbox') {
      return (
        <label key={field._id} className="flex items-start gap-3 rounded-2xl bg-fond-doux p-4 text-sm font-bold">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-orange"
            checked={Boolean(values[field.key])}
            onChange={(event) => updateValue(field, event.target.checked)}
          />
          <span>{field.label}{field.required ? ' *' : ''}</span>
        </label>
      );
    }
    return (
      <Field key={field._id} label={`${field.label}${field.required ? ' *' : ''}`} hint={field.description}>
        <input
          type={field.type}
          className="input"
          placeholder={field.placeholder}
          value={values[field.key] || ''}
          onChange={(event) => updateValue(field, event.target.value)}
        />
      </Field>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Confiance & conformité"
        title="Construisez votre label, étape par étape."
        description="Choisissez votre niveau, complétez le dossier configuré par l’équipe BTB et validez les formations requises."
        stats={[
          { label: 'Formule', value: user?.palier || '—' },
          { label: 'Frais de label', value: paidPlan ? 'Inclus' : 'À l’acte' },
          { label: 'Label actuel', value: user?.label?.niveau || 'Aucun' },
          { label: 'Validité', value: '12 mois' },
        ]}
      />

      {dossierData && (
        <SectionCard
          title={`Dossier ${dossierData.niveauDemande}`}
          description="Votre progression de labellisation en temps réel."
          action={<StatusBadge value={dossierData.statut} />}
        >
          <ol className="grid gap-3 md:grid-cols-3">
            {TIMELINE.filter((s) => s !== 'pieces_manquantes' || dossierData.statut === 'pieces_manquantes').map(
              (s) => {
                const reached =
                  TIMELINE.indexOf(s) <= TIMELINE.indexOf(dossierData.statut) ||
                  (dossierData.statut === 'rejete' && s === 'rejete') ||
                  (dossierData.statut === 'valide' && s === 'valide');
                return (
                  <li
                    key={s}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
                      dossierData.statut === s
                        ? 'border-orange/30 bg-orange-soft text-orange'
                        : reached
                          ? 'border-filet bg-bleu-soft/40 text-ink'
                          : 'border-black/5 text-black/30'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-current" />
                    {s.replace(/_/g, ' ')}
                  </li>
                );
              }
            )}
          </ol>
          {dossierData.motifRejet && (
            <p className="mt-4 text-sm text-red-600">Motif : {dossierData.motifRejet}</p>
          )}
          {dossierData.piecesManquantes?.length > 0 && (
            <p className="mt-2 text-sm">Pièces manquantes : {dossierData.piecesManquantes.join(', ')}</p>
          )}
          {dossierData.formationsRequises?.length > 0 && (
            <div className="mt-5 rounded-2xl bg-fond-doux p-4">
              <p className="text-sm font-extrabold">Formations obligatoires</p>
              <ul className="mt-2 space-y-2 text-sm text-gris">
                {dossierData.formationsRequises.map((formation) => (
                  <li key={formation._id} className="flex items-center justify-between gap-3">
                    <span>{formation.titre}</span>
                    <span className="chip">
                      {dossierData.formationsValidees?.some((id) => String(id) === formation._id)
                        ? 'Validée'
                        : 'À suivre'}
                    </span>
                  </li>
                ))}
              </ul>
              {!dossierData.eligibleFormation && (
                <Link to="/dashboard/formations" className="btn-orange btn-sm mt-4">Voir les formations</Link>
              )}
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard
        title="Nouvelle demande"
        description={paidPlan ? 'Les frais de labellisation sont inclus dans votre abonnement.' : 'La formule Découverte règle l’audit à l’acte.'}
      >
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            {NIVEAUX.map((n) => (
              <button
                key={n.value}
                type="button"
                onClick={() => setNiveau(n.value)}
                className={`rounded-[24px] border bg-gradient-to-br p-5 text-left capitalize transition hover:-translate-y-1 ${
                  n.color
                } ${niveau === n.value ? 'border-orange shadow-soft' : 'border-filet'
                }`}
              >
                <div className="font-display text-xl font-extrabold">{n.value}</div>
                <div className="mt-2 text-sm font-extrabold text-bleu">
                  {paidPlan ? 'Inclus dans votre formule' : formatFcfa(n.price)}
                </div>
                <p className="mt-2 text-xs text-black/60">{n.desc}</p>
              </button>
            ))}
            <div className="sm:col-span-3">
              <button type="button" className="btn-orange" onClick={() => setStep(1)}>
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {formLoading && <div className="h-36 animate-pulse rounded-3xl bg-fond-doux" />}
            {!formLoading && !formulaire && (
              <EmptyState
                title="Formulaire en préparation"
                description="L’administrateur doit encore configurer les champs et les formations de ce niveau."
                icon="⚙"
              />
            )}
            {formulaire && (
              <>
                <div className="rounded-2xl bg-bleu-soft/60 p-4">
                  <p className="font-extrabold text-bleu">{formulaire.titre}</p>
                  <p className="mt-1 text-sm text-gris">{formulaire.description}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {sortedFields.map(renderField)}
                </div>
                {formulaire.formationsRequises?.length > 0 && (
                  <div className="rounded-2xl border border-filet p-4">
                    <p className="text-sm font-extrabold">À valider avant l’attribution</p>
                    <ul className="mt-2 space-y-1 text-sm text-gris">
                      {formulaire.formationsRequises.map((formation) => (
                        <li key={formation._id}>• {formation.titre}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-3">
              <button type="button" className="btn-line" onClick={() => setStep(0)}>
                Retour
              </button>
              <button
                type="button"
                className="btn-orange"
                disabled={!checklistOk || !formulaire}
                onClick={() => setStep(2)}
              >
                Récapitulatif
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p>
              Niveau demandé : <strong className="capitalize">{niveau}</strong>
            </p>
            <p>
              Frais :{' '}
              <strong>
                {paidPlan ? 'Inclus dans votre abonnement' : formatFcfa(NIVEAUX.find((n) => n.value === niveau).price)}
              </strong>
            </p>
            <ul className="text-sm text-black/70">
              {Object.keys(files).map((k) => (
                <li key={k}>✓ {k}</li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button type="button" className="btn-line" onClick={() => setStep(1)}>
                Retour
              </button>
              <button type="button" className="btn-orange" disabled={loading} onClick={submit}>
                {loading
                  ? 'Envoi…'
                  : paidPlan
                    ? 'Déposer mon dossier'
                    : 'Payer l’audit et déposer'}
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
