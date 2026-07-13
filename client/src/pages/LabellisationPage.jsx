import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';

const NIVEAUX = [
  { value: 'bronze', price: 75000, desc: 'Première labellisation vérifiée' },
  { value: 'argent', price: 150000, desc: 'Références et conformité renforcées' },
  { value: 'or', price: 300000, desc: 'Excellence + formation Or requise' },
];

const PIECES = [
  { key: 'ifu', label: 'IFU' },
  { key: 'rccm', label: 'RCCM' },
  { key: 'cnss', label: 'CNSS' },
  { key: 'assurance', label: 'Assurance' },
  { key: 'references', label: 'Références chantiers' },
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
  const [step, setStep] = useState(0);
  const [niveau, setNiveau] = useState('bronze');
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);

  const { data: dossierData, refetch } = useQuery({
    queryKey: ['mon-dossier'],
    queryFn: async () => (await api.get('/me/dossier')).data.data.dossier,
  });

  const checklistOk = useMemo(
    () => PIECES.filter((p) => files[p.key]).length >= 3,
    [files]
  );

  async function submit() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('niveauDemande', niveau);
      for (const [k, f] of Object.entries(files)) {
        if (f) fd.append(k, f);
      }
      const { data } = await api.post('/me/dossiers-label', fd);
      toast.success('Dossier déposé');
      await refetch();
      if (data.data.checkoutUrl) {
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <p className="eyebrow">Labellisation</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Demander un label</h1>
      <p className="mt-2 text-black/65">Bronze · Argent · Or — audit payant, validité 1 an.</p>

      {dossierData && (
        <div className="card mt-8 p-6">
          <h2 className="font-display text-xl font-extrabold">Suivi de votre dossier</h2>
          <p className="mt-1 text-sm capitalize text-black/60">
            Niveau {dossierData.niveauDemande} · statut <strong>{dossierData.statut}</strong>
          </p>
          <ol className="mt-6 space-y-3">
            {TIMELINE.filter((s) => s !== 'pieces_manquantes' || dossierData.statut === 'pieces_manquantes').map(
              (s) => {
                const reached =
                  TIMELINE.indexOf(s) <= TIMELINE.indexOf(dossierData.statut) ||
                  (dossierData.statut === 'rejete' && s === 'rejete') ||
                  (dossierData.statut === 'valide' && s === 'valide');
                return (
                  <li
                    key={s}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold ${
                      dossierData.statut === s ? 'bg-orange-soft text-orange' : reached ? 'text-ink' : 'text-black/30'
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
        </div>
      )}

      <div className="card mt-8 p-6">
        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {NIVEAUX.map((n) => (
              <button
                key={n.value}
                type="button"
                onClick={() => setNiveau(n.value)}
                className={`rounded-[22px] border-[1.5px] p-4 text-left capitalize ${
                  niveau === n.value ? 'border-orange bg-orange-soft' : 'border-black/10'
                }`}
              >
                <div className="font-display text-lg font-extrabold">{n.value}</div>
                <div className="mt-1 text-sm font-extrabold text-bleu">{formatFcfa(n.price)}</div>
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
            <p className="text-sm text-black/65">Joignez au moins 3 pièces (IFU, RCCM, CNSS, assurance, références).</p>
            {PIECES.map((p) => (
              <label key={p.key} className="block text-sm font-bold">
                {p.label}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="mt-1.5 block w-full text-sm"
                  onChange={(e) =>
                    setFiles((prev) => ({ ...prev, [p.key]: e.target.files?.[0] || null }))
                  }
                />
              </label>
            ))}
            <div className="flex gap-3">
              <button type="button" className="btn-line" onClick={() => setStep(0)}>
                Retour
              </button>
              <button
                type="button"
                className="btn-orange"
                disabled={!checklistOk}
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
              Audit : <strong>{formatFcfa(NIVEAUX.find((n) => n.value === niveau).price)}</strong>
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
                {loading ? 'Envoi…' : 'Payer l\'audit et déposer'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Link to="/dashboard" className="mt-6 inline-block text-sm font-bold text-bleu">
        ← Tableau de bord
      </Link>
    </div>
  );
}
