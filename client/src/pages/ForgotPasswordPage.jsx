import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import AuthShell from '../components/layout/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Si un compte existe, un e-mail a été envoyé');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    }
  }

  return (
    <AuthShell
      eyebrow="Récupération"
      title="Mot de passe oublié"
      subtitle="Saisissez votre e-mail : nous vous enverrons un lien pour réinitialiser votre mot de passe."
      footer={
        <p className="text-center text-sm font-medium text-gris">
          <Link to="/connexion" className="font-extrabold text-bleu hover:underline">← Retour à la connexion</Link>
        </p>
      }
    >
      {sent ? (
        <div className="rounded-card border border-filet bg-bleu-soft p-6 text-sm font-medium text-ink">
          <p className="font-bold text-bleu">E-mail envoyé ✓</p>
          <p className="mt-2 text-gris">
            Vérifiez votre boîte mail. En développement, le lien apparaît dans les logs du serveur.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="label" htmlFor="email">Adresse e-mail</label>
            <input id="email" type="email" required placeholder="vous@entreprise.bj" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          <button type="submit" className="btn-orange w-full">Envoyer le lien</button>
        </form>
      )}
    </AuthShell>
  );
}
