import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { infoSchema } from '../lib/schemas';
import {
  DEPARTEMENTS,
  METIERS,
  PALIERS,
  CHARTE_TEXT,
  formatFcfa,
  labelPalier,
  ciblesPourFormule,
  formalitesPour,
} from '../lib/constants';
import OtpInputs from '../components/auth/OtpInputs';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/ui/Logo';
import { Icon } from '../components/ui/icons';
import authBackground from '../../../img.png';

const STEPS = [
  { id: 'formule', label: 'Formule', hint: 'Votre trajectoire' },
  { id: 'cible', label: 'Profil', hint: 'Qui êtes-vous ?' },
  { id: 'infos', label: 'Informations', hint: 'Votre dossier' },
  { id: 'otp', label: 'Vérification', hint: 'E-mail' },
  { id: 'charte', label: 'Charte', hint: 'Engagement' },
  { id: 'paiement', label: 'Activation', hint: 'C\'est parti' },
];

const etapeToIndex = { formule: 0, cible: 1, profil: 1, infos: 2, otp: 3, charte: 4, paiement: 5 };

const PROFIL_ICON = {
  entreprise_btp: Icon.home,
  prestataire: Icon.brief,
  fournisseur: Icon.store,
  artisan: Icon.user,
  maitre_ouvrage: Icon.doc,
};

function Check({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function InscriptionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);

  const palierFromUrl = searchParams.get('palier');
  const initialeEtape = searchParams.get('etape');
  const startStep =
    etapeToIndex[initialeEtape] ??
    (palierFromUrl && PALIERS.some((p) => p.value === palierFromUrl) ? 1 : 0);

  const [step, setStep] = useState(startStep);
  const [palier, setPalier] = useState(
    palierFromUrl && PALIERS.some((p) => p.value === palierFromUrl) ? palierFromUrl : 'decouverte'
  );
  const [cibleId, setCibleId] = useState(null);
  const [profilType, setProfilType] = useState(user?.profilType || null);
  const [email, setEmail] = useState(user?.email || '');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [charteOk, setCharteOk] = useState(false);
  const [moyenPaiement, setMoyenPaiement] = useState('mtn');
  const [rccmFile, setRccmFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const formuleMeta = useMemo(() => PALIERS.find((p) => p.value === palier), [palier]);
  const cibles = useMemo(() => ciblesPourFormule(palier), [palier]);
  const cibleMeta = useMemo(() => cibles.find((c) => c.value === cibleId), [cibles, cibleId]);
  const formalites = useMemo(() => formalitesPour(profilType), [profilType]);

  useEffect(() => {
    const e = searchParams.get('etape');
    if (e && etapeToIndex[e] != null) setStep(etapeToIndex[e]);
    const p = searchParams.get('palier');
    if (p && PALIERS.some((x) => x.value === p)) {
      setPalier(p);
      if (!e) setStep(1);
    }
  }, [searchParams]);

  useEffect(() => {
    setCibleId(null);
    setProfilType(null);
  }, [palier]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const form = useForm({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      email: '', password: '', prenom: '', nom: '', telephone: '', entreprise: '', ifu: '',
      departement: 'Littoral', ville: '', zonesIntervention: '', presentation: '', metiers: [],
    },
  });

  const canSubmitPalier = useMemo(() => {
    if (palier === 'decouverte' || palier === 'business') return true;
    return Boolean(moyenPaiement);
  }, [palier, moyenPaiement]);

  function selectCible(c) {
    setCibleId(c.value);
    setProfilType(c.profilType);
  }

  async function onInfosSubmit(values) {
    if (!profilType || !cibleId) {
      toast.error('Choisissez votre profil / cible');
      return;
    }
    const needsRccm = profilType !== 'maitre_ouvrage';
    const needsIfu = ['entreprise_btp', 'prestataire', 'fournisseur'].includes(profilType);
    const needsEntreprise = ['entreprise_btp', 'fournisseur', 'prestataire'].includes(profilType);

    if (needsEntreprise && !values.entreprise?.trim()) { toast.error('Indiquez la raison sociale / structure'); return; }
    if (needsIfu && !values.ifu?.trim()) { toast.error('IFU obligatoire pour ce type de profil'); return; }
    if (needsRccm && !rccmFile) { toast.error('Joignez votre RCCM (PDF, DOC ou DOCX)'); return; }
    if (rccmFile && !/\.(pdf|doc|docx)$/i.test(rccmFile.name)) { toast.error('RCCM : formats acceptés PDF, DOC, DOCX'); return; }
    if (profilType === 'artisan' && !(values.metiers || []).length) { toast.error('Sélectionnez au moins un métier'); return; }

    setLoading(true);
    try {
      const zonesIntervention = (values.zonesIntervention || '').split(',').map((s) => s.trim()).filter(Boolean);
      let metiers = values.metiers || [];
      if (profilType === 'fournisseur' && !metiers.includes('fourniture_materiaux')) {
        metiers = [...metiers, 'fourniture_materiaux'];
      }

      const fd = new FormData();
      fd.append('profilType', profilType);
      fd.append('email', values.email);
      fd.append('password', values.password);
      fd.append('prenom', values.prenom);
      fd.append('nom', values.nom);
      fd.append('telephone', values.telephone);
      if (values.entreprise) fd.append('entreprise', values.entreprise);
      if (values.ifu) fd.append('ifu', values.ifu);
      fd.append('departement', values.departement);
      fd.append('ville', values.ville);
      fd.append('zonesIntervention', JSON.stringify(zonesIntervention));
      fd.append('metiers', JSON.stringify(metiers));
      if (values.presentation) fd.append('presentation', values.presentation);
      if (rccmFile) fd.append('rccm', rccmFile);

      const { data } = await api.post('/auth/register', fd);
      setEmail(values.email);
      const code = data.data?.devOtp;
      if (code) { setDevOtp(code); setOtp(code); toast.success(`Code OTP démo : ${code}`); }
      else { setDevOtp(null); toast.success(data.message || 'Code OTP envoyé'); }
      setResendIn(60);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Inscription impossible');
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp() {
    if (otp.length !== 6) { toast.error('Saisissez le code à 6 chiffres'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', { email, code: otp });
      setSession(data.data.user, data.data.accessToken);
      toast.success('E-mail vérifié');
      setStep(4);
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
      const { data } = await api.post('/auth/otp/resend', { email });
      const code = data.data?.devOtp;
      if (code) { setDevOtp(code); setOtp(code); toast.success(`Nouveau code OTP démo : ${code}`); }
      else { toast.success(data.message || 'Nouveau code envoyé'); }
      setResendIn(60);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Renvoi impossible');
    } finally {
      setLoading(false);
    }
  }

  async function onAcceptCharte() {
    if (!charteOk) { toast.error('Acceptez la charte pour continuer'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/charte/accept');
      setSession(data.data.user, useAuthStore.getState().accessToken);
      toast.success('Charte acceptée');
      setStep(5);
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
        toast.success('Paiement sandbox initié');
        if (data.data.checkoutUrl) {
          navigate(
            data.data.checkoutUrl.replace(/^https?:\/\/[^/]+/, '') ||
              `/paiement/retour?ref=${data.data.paiement?.refInterne}`
          );
        } else if (data.data.paiement?.refInterne) {
          navigate(`/paiement/retour?ref=${data.data.paiement.refInterne}`);
        }
      } else if (data.data.needsCommercial) {
        toast.success(data.data.message || 'Demande Business enregistrée');
        navigate('/dashboard');
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

  const current = STEPS[step];
  const prices = (p) => (p.price === 0 ? 'Gratuit' : p.price == null ? 'Sur devis' : `${formatFcfa(p.price)} / an`);
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      className="relative min-h-screen bg-cover bg-center p-0 lg:grid lg:place-items-center lg:p-8"
      style={{ backgroundImage: `linear-gradient(rgba(5,18,42,.42), rgba(5,18,42,.68)), url(${authBackground})` }}
    >
      <div className="page-enter grid min-h-screen w-full max-w-[1440px] overflow-hidden bg-white shadow-[0_30px_100px_rgba(4,20,48,.48)] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1fr)_390px] lg:rounded-[34px]">
      {/* ---------- Panneau marque + stepper ---------- */}
      <aside className="relative order-2 hidden overflow-hidden bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <img src={authBackground} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/65 via-bleu/35 to-ink/95" />
        <ol className="relative space-y-1.5">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.id} className="flex items-center gap-4">
                <span className="relative flex flex-col items-center">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full text-sm font-extrabold transition ${
                      done ? 'bg-orange text-white' : active ? 'bg-white text-ink ring-4 ring-orange/40' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {done ? <Check /> : i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className={`absolute top-9 h-[calc(100%+0.4rem)] w-0.5 ${i < step ? 'bg-orange' : 'bg-white/12'}`} />
                  )}
                </span>
                <span className={`py-1.5 ${active ? '' : 'opacity-70'}`}>
                  <span className={`block text-sm font-bold ${active ? 'text-white' : done ? 'text-orange' : 'text-white/60'}`}>{s.label}</span>
                  <span className="block text-xs text-white/45">{s.hint}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange">Votre sélection</p>
          <p className="mt-1.5 text-sm font-bold text-white">
            {formuleMeta ? formuleMeta.title : '—'}
            <span className="font-medium text-white/60"> · {formuleMeta ? prices(formuleMeta) : ''}</span>
          </p>
          {cibleMeta && <p className="mt-0.5 text-xs text-white/60">{cibleMeta.title}</p>}
        </div>
      </aside>

      {/* ---------- Contenu ---------- */}
      <main className="auth-paper auth-registration relative order-1 flex min-w-0 flex-col bg-white">
        {/* Barre mobile */}
        <div className="sticky top-0 z-10 border-b border-filet bg-fond-doux/90 px-5 py-4 backdrop-blur-xl lg:hidden">
          <div className="text-center text-xs font-bold text-gris">Étape {step + 1}/{STEPS.length}</div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full bg-orange transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8 md:px-12 md:py-12 lg:pr-16">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-4 flex justify-center sm:mb-7">
              <Logo to="/" size="sm" />
            </div>
            <p className="eyebrow">Adhésion · Étape {step + 1} sur {STEPS.length}</p>
            <h1 className="mt-2 text-2xl font-extrabold sm:mt-3 sm:text-3xl md:text-[2.5rem] md:leading-[1.05]">
              {step === 0 && 'Choisissez votre formule'}
              {step === 1 && 'Quel est votre profil ?'}
              {step === 2 && 'Complétez votre dossier'}
              {step === 3 && 'Vérifiez votre e-mail'}
              {step === 4 && "Charte d'adhésion"}
              {step === 5 && 'Activez votre compte'}
            </h1>
            <p className="mt-2 text-xs font-medium leading-5 text-gris sm:mt-3 sm:text-sm">
              {step === 0 && 'Adhésion annuelle — 0 % de rétrocession. Vous pourrez changer plus tard.'}
              {step === 1 && <>Formule <strong className="text-ink">{labelPalier(palier)}</strong> — sélectionnez la cible qui vous correspond.</>}
              {step === 2 && 'Ces informations constituent votre fiche et votre dossier de labellisation.'}
              {step === 3 && <>Un code à 6 chiffres a été généré pour <strong className="text-ink">{email}</strong> (valide 10 min).</>}
              {step === 4 && 'Lisez et acceptez la charte pour finaliser votre adhésion.'}
              {step === 5 && 'Dernière étape avant de rejoindre la communauté.'}
            </p>

            <div className="mt-5 sm:mt-8">
              {/* ---- Étape 0 : Formule ---- */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    {PALIERS.map((p) => {
                      const sel = palier === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPalier(p.value)}
                          className={`group relative rounded-[22px] border-[1.6px] bg-white p-4 text-left transition hover:-translate-y-0.5 sm:rounded-3xl sm:p-5 ${
                            sel ? 'border-orange shadow-cta' : 'border-filet hover:border-bleu/40'
                          }`}
                        >
                          <span className={`absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full border-2 transition ${sel ? 'border-orange bg-orange text-white' : 'border-black/15 text-transparent'}`}>
                            <Check />
                          </span>
                          <div className="text-lg font-extrabold">{p.title}</div>
                          <div className="mt-1 text-sm font-extrabold text-bleu">{prices(p)}</div>
                          <p className="mt-1.5 pr-8 text-[10px] font-bold uppercase tracking-wide text-gris sm:mt-2 sm:pr-0 sm:text-[11px]">{p.cible}</p>
                          <ul className="mt-3 hidden space-y-1.5 text-xs text-ink/70 sm:block">
                            {p.features.slice(0, 4).map((f) => (
                              <li key={f} className="flex items-start gap-1.5">
                                <span className="mt-0.5 text-orange"><Check className="h-3 w-3" /></span>{f}
                              </li>
                            ))}
                          </ul>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Link to="/connexion" className="text-sm font-bold text-bleu hover:underline">J&apos;ai déjà un compte</Link>
                    <button type="button" className="btn-orange" onClick={() => setStep(1)}>
                      Continuer {Icon.arrowRight({ className: 'h-4 w-4' })}
                    </button>
                  </div>
                </div>
              )}

              {/* ---- Étape 1 : Profil / cible ---- */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    {cibles.map((c) => {
                      const sel = cibleId === c.value;
                      const Ico = PROFIL_ICON[c.profilType] || Icon.user;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => selectCible(c)}
                          className={`group relative rounded-[22px] border-[1.6px] bg-white p-4 text-left transition hover:-translate-y-0.5 sm:rounded-3xl sm:p-5 ${
                            sel ? 'border-orange shadow-cta' : 'border-filet hover:border-bleu/40'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className={`grid h-12 w-12 place-items-center rounded-2xl transition ${sel ? 'bg-orange text-white' : 'bg-bleu-soft text-bleu'}`}>
                              <Ico className="h-6 w-6" />
                            </span>
                            <span className={`grid h-6 w-6 place-items-center rounded-full border-2 transition ${sel ? 'border-orange bg-orange text-white' : 'border-black/15 text-transparent'}`}>
                              <Check />
                            </span>
                          </div>
                          <div className="mt-3 text-base font-extrabold sm:mt-4 sm:text-lg">{c.title}</div>
                          <p className="mt-1 text-xs text-gris sm:text-sm">{c.desc}</p>
                          {sel && (
                            <ul className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
                              {formalitesPour(c.profilType).map((f) => (
                                <li key={f} className="chip-orange">{f}</li>
                              ))}
                            </ul>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="btn-line" onClick={() => setStep(0)}>Changer de formule</button>
                    <button type="button" className="btn-orange" disabled={!cibleId} onClick={() => setStep(2)}>
                      Continuer {Icon.arrowRight({ className: 'h-4 w-4' })}
                    </button>
                  </div>
                </div>
              )}

              {/* ---- Étape 2 : Informations ---- */}
              {step === 2 && (
                <form className="grid gap-3 sm:grid-cols-2 sm:gap-5" onSubmit={form.handleSubmit(onInfosSubmit)}>
                  {cibleMeta && (
                    <div className="sm:col-span-2 rounded-2xl border border-filet bg-bleu-soft p-4">
                      <p className="text-sm font-extrabold text-bleu">Dossier — {cibleMeta.title} · {labelPalier(palier)}</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {formalites.map((f) => <li key={f} className="chip">{f}</li>)}
                      </ul>
                    </div>
                  )}
                  {[
                    ['prenom', 'Prénom'],
                    ['nom', 'Nom'],
                    ['email', 'E-mail', 'email'],
                    ['telephone', 'Téléphone'],
                    ['password', 'Mot de passe', 'password'],
                    ['entreprise', profilType === 'maitre_ouvrage' ? 'Structure (optionnel)' : 'Entreprise / structure'],
                    ['ifu', ['entreprise_btp', 'prestataire', 'fournisseur'].includes(profilType) ? 'IFU (obligatoire)' : 'IFU (optionnel)'],
                    ['ville', 'Ville'],
                  ].map(([name, label, type = 'text']) => (
                    <div key={name}>
                      <label className="label" htmlFor={name}>{label}</label>
                      <input id={name} type={type} className="input" {...form.register(name)} />
                      {form.formState.errors[name] && <p className="field-error">{form.formState.errors[name].message}</p>}
                    </div>
                  ))}

                  <div>
                    <label className="label" htmlFor="departement">Département</label>
                    <select id="departement" className="input" {...form.register('departement')}>
                      {DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {profilType !== 'maitre_ouvrage' && (
                    <div className="sm:col-span-2">
                      <label className="label">RCCM <span className="text-orange">(PDF, DOC ou DOCX — obligatoire)</span></label>
                      <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] border-dashed px-4 py-4 transition ${rccmFile ? 'border-bleu bg-bleu-soft' : 'border-black/15 bg-white hover:border-bleu'}`}>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white">{Icon.doc({ className: 'h-5 w-5' })}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">{rccmFile ? rccmFile.name : 'Joindre l\'extrait RCCM'}</span>
                          <span className="block text-xs text-gris">{rccmFile ? 'Cliquez pour remplacer' : 'PDF, DOC ou DOCX'}</span>
                        </span>
                        {rccmFile && <span className="text-bleu">{Icon.badge({ className: 'h-5 w-5' })}</span>}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => setRccmFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  )}

                  {profilType !== 'maitre_ouvrage' && (
                    <div className="sm:col-span-2">
                      <label className="label" htmlFor="zones">Zones d&apos;intervention <span className="font-medium text-gris">(séparées par des virgules)</span></label>
                      <input id="zones" className="input" {...form.register('zonesIntervention')} />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="presentation">{profilType === 'artisan' ? 'Présentation / CV' : 'Présentation'}</label>
                    <textarea id="presentation" rows={3} className="input" {...form.register('presentation')} />
                  </div>

                  {profilType !== 'maitre_ouvrage' && (
                    <fieldset className="sm:col-span-2">
                      <legend className="label">Métiers {profilType === 'artisan' ? '(au moins un)' : ''}</legend>
                      <div className="flex flex-wrap gap-2">
                        {METIERS.map((m) => {
                          const selected = form.watch('metiers')?.includes(m.value);
                          return (
                            <button
                              key={m.value}
                              type="button"
                              onClick={() => {
                                const cur = form.getValues('metiers') || [];
                                form.setValue('metiers', selected ? cur.filter((x) => x !== m.value) : [...cur, m.value]);
                              }}
                              className={`rounded-pill border px-3.5 py-1.5 text-xs font-extrabold transition ${
                                selected ? 'border-bleu bg-bleu text-white' : 'border-filet bg-white text-ink hover:border-bleu'
                              }`}
                            >
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-2">
                    <button type="button" className="btn-line" onClick={() => setStep(1)}>Retour</button>
                    <button type="submit" className="btn-orange" disabled={loading}>
                      {loading ? 'Envoi…' : 'Recevoir le code OTP'}
                    </button>
                  </div>
                </form>
              )}

              {/* ---- Étape 3 : OTP ---- */}
              {step === 3 && (
                <div className="space-y-6">
                  {devOtp && (
                    <div className="rounded-2xl border-[1.5px] border-orange/40 bg-orange-soft p-5 text-center">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-orange">Mode démo — SMTP non configuré</p>
                      <p className="mt-2 text-4xl font-extrabold tracking-[0.35em] text-ink">{devOtp}</p>
                      <p className="mt-2 text-xs text-gris">Code prérempli ci-dessous. En production, il sera envoyé par e-mail.</p>
                    </div>
                  )}
                  <OtpInputs value={otp} onChange={setOtp} />
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="btn-orange" disabled={loading} onClick={onVerifyOtp}>Vérifier mon e-mail</button>
                    <button type="button" className="btn-line" disabled={loading || resendIn > 0} onClick={onResendOtp}>
                      {resendIn > 0 ? `Renvoyer (${resendIn}s)` : 'Renvoyer le code'}
                    </button>
                  </div>
                </div>
              )}

              {/* ---- Étape 4 : Charte ---- */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-filet bg-white p-5 text-sm leading-relaxed text-ink/80">
                    {CHARTE_TEXT}
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-filet bg-white p-4 text-sm font-bold">
                    <input type="checkbox" className="mt-0.5 h-5 w-5 accent-orange" checked={charteOk} onChange={(e) => setCharteOk(e.target.checked)} />
                    J&apos;ai lu et j&apos;accepte la charte d&apos;adhésion (acceptation horodatée).
                  </label>
                  <button type="button" className="btn-orange" disabled={loading || !charteOk} onClick={onAcceptCharte}>
                    Accepter et continuer
                  </button>
                </div>
              )}

              {/* ---- Étape 5 : Activation ---- */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border-[1.5px] border-orange/30 bg-orange-soft p-5">
                    <div>
                      <p className="text-xl font-extrabold">{formuleMeta?.title}</p>
                      {cibleMeta && <p className="mt-1 text-sm text-ink/70">Profil : {cibleMeta.title}</p>}
                    </div>
                    <p className="text-lg font-extrabold text-bleu">{formuleMeta ? prices(formuleMeta) : ''}</p>
                  </div>

                  {palier !== 'decouverte' && palier !== 'business' && (
                    <div>
                      <p className="label">Moyen de paiement (FSPay)</p>
                      <div className="flex flex-wrap gap-2">
                        {[['mtn', 'MTN MoMo'], ['moov', 'Moov Money'], ['celtiis', 'Celtiis'], ['carte', 'Carte bancaire'], ['virement', 'Virement']].map(([v, label]) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setMoyenPaiement(v)}
                            className={`rounded-pill border px-4 py-2 text-xs font-extrabold transition ${
                              moyenPaiement === v ? 'border-ink bg-ink text-white' : 'border-filet bg-white text-ink hover:border-bleu'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {palier === 'business' && (
                    <p className="rounded-2xl border border-filet bg-white p-4 text-sm text-ink/70">
                      Formule Business : un conseiller vous contacte pour un devis à la carte.
                    </p>
                  )}

                  <button type="button" className="btn-orange" disabled={loading || !canSubmitPalier} onClick={onSelectPalier}>
                    {palier === 'decouverte' ? 'Activer mon compte' : palier === 'business' ? 'Envoyer ma demande Business' : 'Continuer vers le paiement'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
