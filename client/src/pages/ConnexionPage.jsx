import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { loginSchema } from '../lib/schemas';
import { useAuthStore } from '../store/authStore';

export default function ConnexionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

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
    <div className="mx-auto max-w-md px-4 py-12 md:px-8">
      <div className="card p-8">
        <p className="eyebrow">Espace membre</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Connexion</h1>
        <form className="mt-8 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block text-sm font-bold">
            E-mail
            <input
              type="email"
              className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3"
              {...form.register('email')}
            />
          </label>
          <label className="block text-sm font-bold">
            Mot de passe
            <input
              type="password"
              className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3"
              {...form.register('password')}
            />
          </label>
          <div className="flex justify-end">
            <Link to="/mot-de-passe-oublie" className="text-sm font-bold text-bleu hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <button type="submit" className="btn-orange w-full">
            Se connecter
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-black/60">
          Pas encore membre ?{' '}
          <Link to="/inscription" className="font-extrabold text-orange">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
