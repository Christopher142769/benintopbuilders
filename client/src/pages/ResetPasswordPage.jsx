import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import AuthShell from '../components/layout/AuthShell';

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
    <AuthShell
      eyebrow="Sécurité"
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe d'au moins 8 caractères."
      footer={
        <p className="text-center text-sm font-medium text-gris">
          <Link to="/connexion" className="font-extrabold text-bleu hover:underline">← Retour à la connexion</Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="label" htmlFor="password">Mot de passe</label>
          <input id="password" type="password" required minLength={8} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
          <p className="field-hint">Minimum 8 caractères.</p>
        </div>
        <button type="submit" className="btn-orange w-full disabled:opacity-60" disabled={!token}>Enregistrer</button>
        {!token && <p className="field-error">Lien invalide ou expiré.</p>}
      </form>
    </AuthShell>
  );
}
