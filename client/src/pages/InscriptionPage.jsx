import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { infoSchema } from '../lib/schemas';
import {
  PROFIL_OPTIONS,
  DEPARTEMENTS,
  METIERS,
  PALIERS,
  CHARTE_TEXT,
  formatFcfa,
} from '../lib/constants';
import OtpInputs from '../components/auth/OtpInputs';
import { useAuthStore } from '../store/authStore';

const STEPS = [
  { id: 'profil', label: 'Profil' },
  { id: 'infos', label: 'Informations' },
  { id: 'otp', label: 'Vérification' },
  { id: 'charte', label: 'Charte' },
  { id: 'paiement', label: 'Palier' },
];

const etapeToIndex = { profil: 0, infos: 1, otp: 2, charte: 3, paiement: 4 };

export default function InscriptionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);

  const initialStep = etapeToIndex[searchParams.get('etape')] ?? 0;
  const [step, setStep] = useState(initialStep);
  const [profilType, setProfilType] = useState(user?.profilType || null);
  const [email, setEmail] = useState(user?.email || '');
  const [otp, setOtp] = useState('');
  const [charteOk, setCharteOk] = useState(false);
  const [palier, setPalier] = useState('decouverte');
  const [moyenPaiement, setMoyenPaiement] = useState('mtn');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    const e = searchParams.get('etape');
    if (e && etapeToIndex[e] != null) setStep(etapeToIndex[e]);
  }, [searchParams]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const form = useForm({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      email: '',
      password: '',
      prenom: '',
      nom: '',
      telephone: '',
      entreprise: '',
      ifu: '',
      rccm: '',
      departement: 'Littoral',
      ville: '',
      zonesIntervention: '',
      presentation: '',
      metiers: [],
    },
  });

  const stepLabel = STEPS[step]?.label;

  const canSubmitPalier = useMemo(() => {
    if (palier === 'decouverte') return true;
    return Boolean(moyenPaiement);
  }, [palier, moyenPaiement]);

  async function onInfosSubmit(values) {
    if (!profilType) {
      toast.error('Choisissez un profil');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...values,
        profilType,
        zonesIntervention: (values.zonesIntervention || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        metiers: values.metiers || [],
      };
      if (profilType === 'fournisseur' && !payload.metiers.includes('fourniture_materiaux')) {
        payload.metiers = [...payload.metiers, 'fourniture_materiaux'];
      }
      const { data } = await api.post('/auth/register', payload);
      setEmail(values.email);
      toast.success(data.message || 'Code OTP envoyé');
      setResendIn(60);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Inscription impossible');
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp() {
    if (otp.length !== 6) {
      toast.error('Saisissez le code à 6 chiffres');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', { email, code: otp });
      setSession(data.data.user, data.data.accessToken);
      toast.success('E-mail vérifié');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  }

  async function onResendOtp() {
    if (resendIn > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/otp/resend', { email });
      toast.success('Nouveau code envoyé');
      setResendIn(60);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Renvoi impossible');
    } finally {
      setLoading(false);
    }
  }

  async function onAcceptCharte() {
    if (!charteOk) {
      toast.error('Acceptez la charte pour continuer');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/charte/accept');
      setSession(data.data.user, useAuthStore.getState().accessToken);
      toast.success('Charte acceptée');
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Échec');
    } finally {
      setLoading(false);
    }
  }

  async function onSelectPalier() {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/adhesion/palier', { palier });
      setSession(data.data.user, useAuthStore.getState().accessToken);
      if (data.data.needsPayment) {
        toast(
          `Paiement ${formatFcfa(data.data.montant)} via FSPay — disponible prochainement (sandbox étape 4).`,
          { icon: '⏳' }
        );
      } else {
        toast.success('Compte activé — bienvenue !');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Échec');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[280px_1fr] md:px-8">
      <aside className="rounded-[28px] bg-ink p-6 text-white md:sticky md:top-24 md:self-start">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange">Adhésion</p>
        <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight">
          Rejoignez l&apos;écosystème BTP
        </h1>
        <ol className="mt-8 space-y-3">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold ${
                i === step ? 'bg-white/10 text-white' : i < step ? 'text-orange' : 'text-white/40'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                  i <= step ? 'bg-orange text-white' : 'bg-white/10'
                }`}
              >
                {i + 1}
              </span>
              {s.label}
            </li>
          ))}
        </ol>
      </aside>

      <section className="card p-6 md:p-8">
        <p className="eyebrow">Étape {step + 1} / {STEPS.length}</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold md:text-3xl">{stepLabel}</h2>

        {step === 0 && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {PROFIL_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setProfilType(p.value)}
                className={`rounded-[22px] border-[1.5px] p-4 text-left transition ${
                  profilType === p.value
                    ? 'border-orange bg-orange-soft shadow-soft'
                    : 'border-black/10 hover:border-bleu/40'
                }`}
              >
                <div className="font-display text-lg font-extrabold">{p.title}</div>
                <p className="mt-1 text-sm text-black/60">{p.desc}</p>
              </button>
            ))}
            <div className="sm:col-span-2 mt-4">
              <button
                type="button"
                disabled={!profilType}
                className="btn-orange"
                onClick={() => setStep(1)}
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onInfosSubmit)}>
            {[
              ['prenom', 'Prénom'],
              ['nom', 'Nom'],
              ['email', 'E-mail'],
              ['telephone', 'Téléphone'],
              ['password', 'Mot de passe', 'password'],
              ['entreprise', 'Entreprise / structure'],
              ['ifu', 'IFU'],
              ['rccm', 'RCCM'],
              ['ville', 'Ville'],
            ].map(([name, label, type = 'text']) => (
              <label key={name} className="block text-sm font-bold">
                {label}
                <input
                  type={type}
                  className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3 font-medium outline-none focus:border-bleu focus:bg-white"
                  {...form.register(name)}
                />
                {form.formState.errors[name] && (
                  <span className="mt-1 block text-xs font-semibold text-red-600">
                    {form.formState.errors[name].message}
                  </span>
                )}
              </label>
            ))}
            <label className="block text-sm font-bold">
              Département
              <select
                className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3 font-medium"
                {...form.register('departement')}
              >
                {DEPARTEMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold sm:col-span-2">
              Zones d&apos;intervention (séparées par des virgules)
              <input
                className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3"
                {...form.register('zonesIntervention')}
              />
            </label>
            <label className="block text-sm font-bold sm:col-span-2">
              Présentation
              <textarea
                rows={3}
                className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3"
                {...form.register('presentation')}
              />
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-bold">Métiers</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {METIERS.map((m) => {
                  const selected = form.watch('metiers')?.includes(m.value);
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => {
                        const cur = form.getValues('metiers') || [];
                        form.setValue(
                          'metiers',
                          selected ? cur.filter((x) => x !== m.value) : [...cur, m.value]
                        );
                      }}
                      className={`rounded-pill px-3 py-1.5 text-xs font-extrabold ${
                        selected ? 'bg-bleu text-white' : 'bg-fond-doux text-ink'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="sm:col-span-2 mt-2 flex gap-3">
              <button type="button" className="btn-line" onClick={() => setStep(0)}>
                Retour
              </button>
              <button type="submit" className="btn-orange" disabled={loading}>
                {loading ? 'Envoi…' : 'Recevoir le code OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="mt-8 space-y-6">
            <p className="text-black/70">
              Un code à 6 chiffres a été envoyé à <strong>{email}</strong>. Valide 10 minutes.
            </p>
            <OtpInputs value={otp} onChange={setOtp} />
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-orange" disabled={loading} onClick={onVerifyOtp}>
                Vérifier
              </button>
              <button
                type="button"
                className="btn-line"
                disabled={loading || resendIn > 0}
                onClick={onResendOtp}
              >
                {resendIn > 0 ? `Renvoyer (${resendIn}s)` : 'Renvoyer le code'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8 space-y-6">
            <div className="max-h-72 overflow-y-auto rounded-[22px] border-[1.5px] border-filet bg-fond-doux p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {CHARTE_TEXT}
            </div>
            <label className="flex items-start gap-3 text-sm font-bold">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-orange"
                checked={charteOk}
                onChange={(e) => setCharteOk(e.target.checked)}
              />
              J&apos;ai lu et j&apos;accepte la charte d&apos;adhésion (acceptation horodatée).
            </label>
            <button type="button" className="btn-orange" disabled={loading || !charteOk} onClick={onAcceptCharte}>
              Accepter et continuer
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {PALIERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPalier(p.value)}
                  className={`rounded-[22px] border-[1.5px] p-4 text-left ${
                    palier === p.value ? 'border-orange bg-orange-soft' : 'border-black/10'
                  }`}
                >
                  <div className="font-display text-lg font-extrabold">{p.title}</div>
                  <div className="mt-1 text-sm font-extrabold text-bleu">
                    {p.price === 0 ? 'Gratuit' : formatFcfa(p.price) + ' / an'}
                  </div>
                  <ul className="mt-3 space-y-1 text-xs text-black/65">
                    {p.features.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            {palier !== 'decouverte' && (
              <div>
                <p className="text-sm font-bold">Moyen de paiement (FSPay)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ['mtn', 'MTN MoMo'],
                    ['moov', 'Moov Money'],
                    ['celtiis', 'Celtiis'],
                    ['carte', 'Carte bancaire'],
                    ['virement', 'Virement'],
                  ].map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMoyenPaiement(v)}
                      className={`rounded-pill px-4 py-2 text-xs font-extrabold ${
                        moyenPaiement === v ? 'bg-ink text-white' : 'bg-fond-doux'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-black/50">
                  Le checkout FSPay sandbox sera branché à l&apos;étape 4. Choisissez Découverte pour
                  activer immédiatement.
                </p>
              </div>
            )}
            <button
              type="button"
              className="btn-orange"
              disabled={loading || !canSubmitPalier}
              onClick={onSelectPalier}
            >
              {palier === 'decouverte' ? 'Activer mon compte' : 'Continuer vers le paiement'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
