import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { loginSchema } from '../lib/schemas';
import { useAuthStore } from '../store/authStore';
import AuthShell from '../components/layout/AuthShell';
import { useState } from 'react';
import { Icon } from '../components/ui/icons';

export default function ConnexionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values) {
    try {
      const { data } = await api.post('/auth/login', values);
      setSession(data.data.user, data.data.accessToken);
      toast.success('Connexion réussie');
      const dest = location.state?.from?.pathname || data.data.redirect || '/dashboard';
      navigate(dest);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Connexion impossible');
    }
  }

  return (
    <AuthShell
      eyebrow="Espace membre"
      title="Content de vous revoir"
      subtitle="Connectez-vous pour accéder à votre tableau de bord, vos opportunités et votre messagerie."
      footer={
        <p className="text-center text-sm font-medium text-gris">
          Pas encore membre ?{' '}
          <Link to="/inscription" className="font-extrabold text-orange hover:underline">
            Créer un compte
          </Link>
        </p>
      }
    >
      <form className="space-y-4 sm:space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="label" htmlFor="email">Adresse e-mail</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">{Icon.user({ className: 'h-4 w-4' })}</span>
            <input id="email" type="email" autoComplete="email" placeholder="vous@entreprise.bj" className="input !border-0 !bg-transparent !pl-12 !shadow-none" {...form.register('email')} />
          </div>
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Mot de passe</label>
            <Link to="/mot-de-passe-oublie" className="mb-1.5 text-xs font-bold text-bleu hover:underline">Oublié ?</Link>
          </div>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">{Icon.shield({ className: 'h-4 w-4' })}</span>
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" className="input !border-0 !bg-transparent !px-12 !shadow-none" {...form.register('password')} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-bleu" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? 'MASQUER' : 'AFFICHER'}
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-orange w-full shadow-[0_12px_30px_rgba(249,115,22,.28)] disabled:opacity-60">
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </AuthShell>
  );
}
