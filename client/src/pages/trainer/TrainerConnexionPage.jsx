import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import AuthShell from '../../components/layout/AuthShell';
import { Icon } from '../../components/ui/icons';
import trainerBackground from '../../../../img1.png';

const TRAINER_HIGHLIGHTS = [
  'Modules & chapitres pour chaque niveau de label',
  'Tests de fin de chapitre et examens certifiants',
  'Suivi pédagogique et corrections assistées',
];

export default function TrainerConnexionPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({ defaultValues: { email: '', password: '' } });

  async function submit(values) {
    try {
      const { data } = await api.post('/auth/login', values);
      const { user, accessToken } = data.data;
      if (user.role !== 'formateur') {
        toast.error('Cet accès est réservé aux formateurs BTB');
        return;
      }
      setSession(user, accessToken);
      navigate('/formateur', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Connexion impossible');
    }
  }

  return (
    <AuthShell
      eyebrow="Académie Bénin Top Builders"
      title="Espace formateur"
      subtitle="Structurez les parcours, transmettez votre expertise et accompagnez les futurs labellisés."
      background={trainerBackground}
      highlights={TRAINER_HIGHLIGHTS}
      panelTitle={<>Formez. Certifiez.<br />Labellisez.</>}
      footer={<div className="text-center"><Link to="/connexion" className="text-sm font-extrabold text-bleu hover:underline">Retour à l’espace membre</Link></div>}
    >
      <div className="mb-5 rounded-2xl border border-bleu/15 bg-bleu-soft p-4 text-xs font-bold leading-5 text-bleu">
        Votre compte et vos niveaux de labellisation sont attribués par l’administration BTB.
      </div>
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <div>
          <label className="label" htmlFor="trainer-email">Adresse e-mail</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">{Icon.user({ className: 'h-4 w-4' })}</span>
            <input id="trainer-email" type="email" autoComplete="username" className="input !border-0 !bg-transparent !pl-12 !shadow-none" placeholder="formateur@btb.bj" {...form.register('email', { required: true })} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between"><label className="label" htmlFor="trainer-password">Mot de passe</label><Link to="/mot-de-passe-oublie" className="mb-1.5 text-xs font-bold text-bleu hover:underline">Oublié ?</Link></div>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">{Icon.shield({ className: 'h-4 w-4' })}</span>
            <input id="trainer-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="input !border-0 !bg-transparent !px-12 !shadow-none" placeholder="••••••••" {...form.register('password', { required: true })} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-bleu" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'MASQUER' : 'AFFICHER'}</button>
          </div>
        </div>
        <button type="submit" className="btn-ink w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Vérification…' : 'Ouvrir mon espace formateur'}</button>
      </form>
    </AuthShell>
  );
}
