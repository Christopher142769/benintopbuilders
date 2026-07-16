import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { formatFcfa } from '../lib/constants';
import { PALIERS } from '../lib/constants';
import { useNavigate } from 'react-router-dom';
import { EmptyState, PageHeader, SectionCard, StatusBadge } from '../components/ui/PageKit';

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
      } else if (data.data.needsCommercial) {
        toast.success(data.data.message || 'Demande Business envoyée');
      } else {
        toast.success('Palier mis à jour');
        qc.invalidateQueries({ queryKey: ['mes-paiements'] });
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Abonnement & facturation"
        title="Votre formule, sans surprise."
        description="Pilotez votre adhésion, vos droits, votre renouvellement et l’historique de vos règlements."
        stats={[
          { label: 'Formule actuelle', value: user?.palier || '—' },
          { label: 'Statut', value: user?.statut || '—' },
          {
            label: 'Échéance',
            value: user?.adhesionExpireAt
              ? new Date(user.adhesionExpireAt).toLocaleDateString('fr-FR')
              : '—',
          },
          { label: 'Renouvellement', value: user?.renewalAuto ? 'Automatique' : 'Manuel' },
        ]}
      />
      {user?.statut === 'expire' && (
        <div className="mt-4 rounded-2xl bg-orange-soft p-4 text-sm font-bold text-orange">
          Adhésion expirée — votre fiche est masquée. Choisissez un palier pour réactiver.
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <SectionCard title="Choisir une formule" description="Les changements payants sont activés après confirmation FSPay.">
          <div className="grid gap-4 sm:grid-cols-2">
            {PALIERS.map((p) => {
              const current = p.value === user?.palier;
              return (
                <button
                  key={p.value}
                  type="button"
                  className={`rounded-[24px] border p-5 text-left transition hover:-translate-y-1 ${
                    current ? 'border-orange bg-orange-soft shadow-soft' : 'border-filet bg-white'
                  }`}
                  onClick={() => !current && changePalier(p.value)}
                  disabled={current}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display text-lg font-extrabold">{p.title}</div>
                    {current && <span className="chip-orange">Actuelle</span>}
                  </div>
                  <div className="mt-2 text-sm font-extrabold text-bleu">
                    {p.price === 0 ? 'Gratuit' : p.price == null ? 'Sur devis' : `${formatFcfa(p.price)} / an`}
                  </div>
                  <ul className="mt-4 space-y-2 text-xs leading-5 text-gris">
                    {p.features.slice(0, 3).map((feature) => <li key={feature}>✓ {feature}</li>)}
                  </ul>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <aside className="space-y-5">
          <SectionCard title="Renouvellement">
            <div className="flex items-center justify-between">
              <div>
                <StatusBadge value={user?.statut} />
                <p className="mt-3 text-sm text-gris">
                  Échéance le {user?.adhesionExpireAt ? new Date(user.adhesionExpireAt).toLocaleDateString('fr-FR') : '—'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!user?.renewalAuto}
                onClick={toggleRenewal}
                className={`relative h-7 w-12 rounded-full transition ${user?.renewalAuto ? 'bg-bleu' : 'bg-black/15'}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${user?.renewalAuto ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-gris">
              {user?.renewalAuto ? 'Le renouvellement sera tenté automatiquement à l’échéance.' : 'Vous recevrez un rappel avant l’échéance.'}
            </p>
          </SectionCard>
        </aside>
      </div>

      <SectionCard title="Historique des paiements" description="Toutes vos transactions d’adhésion et de renouvellement.">
        {paiements.length === 0 ? (
          <EmptyState title="Aucun paiement" description="Vos futurs règlements apparaîtront ici." icon="₣" />
        ) : (
          <div className="divide-y divide-filet">
            {paiements.map((p) => (
              <div key={p.id || p._id || p.refInterne} className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-extrabold">{p.refInterne}</p>
                  <p className="mt-1 text-xs capitalize text-gris">{p.type} · {new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <strong>{formatFcfa(p.montant)}</strong>
                  <StatusBadge value={p.statut} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
