import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

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
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-8">
        <h1 className="font-display text-2xl font-extrabold">Mot de passe oublié</h1>
        {sent ? (
          <p className="mt-4 text-sm text-black/70">
            Vérifiez votre boîte mail. En développement, le lien apparaît dans les logs serveur.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-bold">
              E-mail
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3"
              />
            </label>
            <button type="submit" className="btn-orange w-full">
              Envoyer le lien
            </button>
          </form>
        )}
        <Link to="/connexion" className="mt-6 inline-block text-sm font-bold text-bleu">
          Retour connexion
        </Link>
      </div>
    </div>
  );
}
