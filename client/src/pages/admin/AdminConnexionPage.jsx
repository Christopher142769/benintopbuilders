import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import AuthShell from '../../components/layout/AuthShell';
import { Icon } from '../../components/ui/icons';

export default function AdminConnexionPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({ defaultValues: { email: '', password: '' } });

  async function submit(values) {
    try {
      const { data } = await api.post('/auth/login', values);
      const { user, accessToken } = data.data;
      if (!['admin', 'superadmin'].includes(user.role)) {
        toast.error('Cet accès est réservé à l’administration');
        return;
      }
      setSession(user, accessToken);
      toast.success('Bienvenue dans l’administration');
      navigate('/admin', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Connexion impossible');
    }
  }

  return (
    <AuthShell
      eyebrow="Accès sécurisé"
      title="Administration BTB"
      subtitle="Connectez-vous avec un compte administrateur ou super-administrateur autorisé."
      footer={
        <div className="text-center">
          <Link to="/connexion" className="text-sm font-extrabold text-bleu hover:underline">
            Accéder à l’espace membre
          </Link>
        </div>
      }
    >
      <div className="mb-5 rounded-2xl border border-orange/20 bg-orange-soft p-4 text-xs font-bold leading-5 text-orange-dark">
        Espace réservé — les tentatives de connexion et actions administratives sont journalisées.
      </div>
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <div>
          <label className="label" htmlFor="admin-email">Adresse e-mail</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">{Icon.user({ className: 'h-4 w-4' })}</span>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              className="input !border-0 !bg-transparent !pl-12 !shadow-none"
              placeholder="administration@btb.bj"
              {...form.register('email', { required: true })}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="admin-password">Mot de passe</label>
            <Link to="/mot-de-passe-oublie" className="mb-1.5 text-xs font-bold text-bleu hover:underline">
              Oublié ?
            </Link>
          </div>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">{Icon.shield({ className: 'h-4 w-4' })}</span>
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              className="input !border-0 !bg-transparent !px-12 !shadow-none"
              placeholder="••••••••"
              {...form.register('password', { required: true })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-bleu"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? 'MASQUER' : 'AFFICHER'}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="btn-ink w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Vérification…' : 'Accéder au back-office'}
        </button>
      </form>
    </AuthShell>
  );
}
