import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { EmptyState, PageHeader } from '../components/ui/PageKit';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function FormationsPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [nb, setNb] = useState(1);

  const { data: formations = [] } = useQuery({
    queryKey: ['formations'],
    queryFn: async () => (await api.get('/formations')).data.data,
  });
  const { data: inscriptions = [] } = useQuery({
    queryKey: ['mes-inscriptions-formations'],
    queryFn: async () => (await api.get('/formations/mes-inscriptions')).data.data,
    enabled: Boolean(user),
  });
  const { data: dossier } = useQuery({
    queryKey: ['mon-dossier-label-formations'],
    queryFn: async () => (await api.get('/me/dossier')).data.data,
    enabled: Boolean(user),
  });

  function canFollow(formation) {
    const formationId = formation.id || formation._id;
    const enrolled = inscriptions.some((item) => {
      const target = item.formationId?.id || item.formationId?._id || item.formationId;
      return String(target) === String(formationId) && ['confirmee', 'presente'].includes(item.statut);
    });
    const required = (dossier?.formationsRequises || []).some((item) =>
      String(item.id || item._id || item) === String(formationId)
    );
    return enrolled || required;
  }

  async function inscrire() {
    if (!user) {
      navigate('/connexion');
      return;
    }
    try {
      const { data } = await api.post(`/formations/${modal._id}/inscriptions`, {
        nbParticipants: Number(nb),
      });
      toast.success(data.message || 'Inscription enregistrée');
      setModal(null);
      qc.invalidateQueries({ queryKey: ['formations'] });
      if (data.data.checkoutUrl) {
        navigate(
          data.data.checkoutUrl.replace(/^https?:\/\/[^/]+/, '') ||
            `/paiement/retour?ref=${data.data.paiement?.refInterne}`
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Échec');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Compétences & labellisation"
        title="Progressez, validez, faites reconnaître votre expertise."
        description="Inscrivez-vous aux sessions professionnelles et complétez les formations requises pour vos labels Bronze, Argent ou Or."
        stats={[
          { label: 'Sessions ouvertes', value: formations.length },
          { label: 'Modalités', value: 'Présentiel & ligne' },
          { label: 'Attestation', value: 'Incluse' },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {formations.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState title="Aucune formation planifiée" description="Les sessions ajoutées par l’équipe apparaîtront ici." icon="◇" />
          </div>
        )}
        {formations.map((f) => (
          <article key={f._id} className="card card-hover overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-bleu to-orange" />
            <div className="p-6">
            <div className="flex flex-wrap gap-2">
              <span className="chip capitalize">{f.modalite}</span>
              {f.requiseLabelOr && <span className="chip-orange">Requise label Or</span>}
            </div>
            <h2 className="font-display text-xl font-extrabold">{f.titre}</h2>
            <p className="mt-2 text-sm text-black/65 line-clamp-3">{f.description}</p>
            <p className="mt-3 text-xs font-bold uppercase text-bleu">
              {f.modalite} · {f.dureeHeures}h · {f.placesRestantes} places
            </p>
            <p className="mt-2 font-extrabold">{formatFcfa(f.tarifMembre)} (membre)</p>
            {canFollow(f) ? (
              <button type="button" className="btn-orange mt-4" onClick={() => navigate(`/dashboard/formations/${f.id || f._id}`)}>
                Continuer le parcours →
              </button>
            ) : (
              <button type="button" className="btn-orange mt-4" onClick={() => setModal(f)}>
                S&apos;inscrire
              </button>
            )}
            </div>
          </article>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="font-display text-xl font-extrabold">{modal.titre}</h3>
            <label className="mt-4 block text-sm font-bold">
              Nombre de participants
              <input
                type="number"
                min={1}
                max={modal.placesRestantes}
                value={nb}
                onChange={(e) => setNb(e.target.value)}
                className="mt-1 w-full rounded-2xl border px-4 py-3"
              />
            </label>
            <div className="mt-6 flex gap-3">
              <button type="button" className="btn-line" onClick={() => setModal(null)}>
                Annuler
              </button>
              <button type="button" className="btn-orange" onClick={inscrire}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
