import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { formatFcfa } from '../lib/constants';
import { PALIERS } from '../lib/constants';
import { useNavigate } from 'react-router-dom';

export default function AdhesionPage() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: paiements = [] } = useQuery({
    queryKey: ['mes-paiements'],
    queryFn: async () => (await api.get('/me/adhesion/paiements')).data.data,
  });

  async function toggleRenewal() {
    const { data } = await api.post('/me/adhesion/renouvellement-auto', {
      enabled: !user?.renewalAuto,
    });
    setSession(data.data.user, token);
    toast.success(data.data.user.renewalAuto ? 'Renouvellement auto activé' : 'Renouvellement auto désactivé');
  }

  async function changePalier(palier) {
    try {
      const { data } = await api.post('/me/adhesion/changer-palier', { palier });
      setSession(data.data.user, token);
      if (data.data.needsPayment && data.data.checkoutUrl) {
        navigate(data.data.checkoutUrl.replace(/^https?:\/\/[^/]+/, ''));
      } else {
        toast.success('Palier mis à jour');
        qc.invalidateQueries({ queryKey: ['mes-paiements'] });
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <p className="eyebrow">Adhésion</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Mon abonnement</h1>
      {user?.statut === 'expire' && (
        <div className="mt-4 rounded-2xl bg-orange-soft p-4 text-sm font-bold text-orange">
          Adhésion expirée — votre fiche est masquée. Choisissez un palier pour réactiver.
        </div>
      )}
      <div className="card mt-6 p-6 text-sm">
        <p>
          Statut <strong>{user?.statut}</strong> · palier <strong>{user?.palier}</strong>
        </p>
        <p className="mt-1 text-black/60">
          Expire le {user?.adhesionExpireAt ? new Date(user.adhesionExpireAt).toLocaleDateString('fr-FR') : '—'}
        </p>
        <label className="mt-4 flex items-center gap-2 font-bold">
          <input type="checkbox" checked={!!user?.renewalAuto} onChange={toggleRenewal} />
          Renouvellement automatique
        </label>
      </div>

      <h2 className="mt-8 font-display text-xl font-extrabold">Changer de palier</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {PALIERS.map((p) => (
          <button
            key={p.value}
            type="button"
            className="card p-4 text-left"
            onClick={() => changePalier(p.value)}
          >
            <div className="font-display font-extrabold">{p.title}</div>
            <div className="text-sm text-bleu font-extrabold">
              {p.price === 0 ? 'Gratuit' : `${formatFcfa(p.price)} / an`}
            </div>
          </button>
        ))}
      </div>

      <h2 className="mt-8 font-display text-xl font-extrabold">Historique des paiements</h2>
      <div className="mt-4 space-y-2">
        {paiements.map((p) => (
          <div key={p._id} className="card flex justify-between p-4 text-sm">
            <span>{p.refInterne} · {p.type}</span>
            <span className="font-bold">{formatFcfa(p.montant)} · {p.statut}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
