import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <p className="eyebrow">Compétences</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Formations</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {formations.map((f) => (
          <article key={f._id} className="card p-6">
            <h2 className="font-display text-xl font-extrabold">{f.titre}</h2>
            <p className="mt-2 text-sm text-black/65 line-clamp-3">{f.description}</p>
            <p className="mt-3 text-xs font-bold uppercase text-bleu">
              {f.modalite} · {f.dureeHeures}h · {f.placesRestantes} places
            </p>
            <p className="mt-2 font-extrabold">{formatFcfa(f.tarifMembre)} (membre)</p>
            <button type="button" className="btn-orange mt-4" onClick={() => setModal(f)}>
              S&apos;inscrire
            </button>
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
