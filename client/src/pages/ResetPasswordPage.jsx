import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Mot de passe mis à jour');
      navigate('/connexion');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Lien invalide');
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-8">
        <h1 className="font-display text-2xl font-extrabold">Nouveau mot de passe</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">
            Mot de passe
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3"
            />
          </label>
          <button type="submit" className="btn-orange w-full" disabled={!token}>
            Enregistrer
          </button>
        </form>
        <Link to="/connexion" className="mt-6 inline-block text-sm font-bold text-bleu">
          Connexion
        </Link>
      </div>
    </div>
  );
}
