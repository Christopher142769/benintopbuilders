import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { formatFcfa } from '../lib/constants';

export default function PaiementRetourPage() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [paiement, setPaiement] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [relanceLoading, setRelanceLoading] = useState(false);

  async function load() {
    if (!ref || !accessToken) {
      setLoading(false);
      if (!accessToken) setError('Connectez-vous pour voir le statut du paiement.');
      return;
    }
    try {
      const { data } = await api.get(`/paiements/${encodeURIComponent(ref)}`);
      setPaiement(data.data.paiement);
      if (data.data.user) {
        setSession(data.data.user, accessToken);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Paiement introuvable');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, accessToken]);

  async function relancer() {
    setRelanceLoading(true);
    try {
      const { data } = await api.post(`/paiements/${encodeURIComponent(ref)}/relancer`);
      window.location.href = data.data.checkoutUrl;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Relance impossible');
    } finally {
      setRelanceLoading(false);
    }
  }

  const statut = paiement?.statut;
  const success = statut === 'reussi';
  const failed = statut === 'echec' || statut === 'expire';

  return (
    <div className="mx-auto max-w-lg px-4 py-12 md:px-8">
      <div className="card p-8 text-center">
        <p className="eyebrow justify-center">Paiement FSPay</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">
          {loading && 'Vérification…'}
          {!loading && success && 'Paiement réussi'}
          {!loading && failed && 'Paiement échoué'}
          {!loading && !success && !failed && !error && 'Paiement en cours'}
          {!loading && error && 'Statut indisponible'}
        </h1>

        {ref && (
          <p className="mt-3 text-sm text-black/55">
            Réf. <span className="font-bold text-ink">{ref}</span>
          </p>
        )}

        {paiement && (
          <p className="mt-4 text-lg font-extrabold text-bleu">{formatFcfa(paiement.montant)}</p>
        )}

        {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

        {success && (
          <p className="mt-4 text-sm text-black/70">
            Votre adhésion est active. Un reçu a été envoyé par e-mail.
          </p>
        )}
        {!loading && !success && !failed && !error && (
          <p className="mt-4 text-sm text-black/70">
            Confirmation sandbox en cours (environ 2 secondes)…
          </p>
        )}
        {failed && (
          <p className="mt-4 text-sm text-black/70">
            {paiement?.echecMotif || 'Le paiement n\'a pas abouti. Vous pouvez relancer.'}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {success && (
            <Link to="/dashboard" className="btn-orange">
              Aller au tableau de bord
            </Link>
          )}
          {(failed || (!success && !loading && paiement)) && !success && (
            <button type="button" className="btn-orange" disabled={relanceLoading} onClick={relancer}>
              {relanceLoading ? 'Relance…' : 'Relancer le paiement'}
            </button>
          )}
          <Link to="/connexion" className="btn-line">
            Connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
