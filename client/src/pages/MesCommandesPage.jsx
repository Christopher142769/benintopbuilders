import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';
import { Link } from 'react-router-dom';
import { EmptyState, PageHeader, StatusBadge } from '../components/ui/PageKit';
import toast from 'react-hot-toast';

export default function MesCommandesPage() {
  const qc = useQueryClient();
  const [reviewing, setReviewing] = useState(null);
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const { data: commandes = [] } = useQuery({
    queryKey: ['mes-commandes'],
    queryFn: async () => (await api.get('/materiaux/commandes')).data.data,
  });

  async function finaliser(id) {
    try {
      await api.patch(`/materiaux/commandes/${id}/statut`, { statut: 'finalisee' });
      toast.success('Échange clôturé, vous pouvez maintenant laisser un avis');
      qc.invalidateQueries({ queryKey: ['mes-commandes'] });
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Action impossible');
    }
  }

  async function envoyerAvis(event) {
    event.preventDefault();
    const vendeur = reviewing.lignes?.[0]?.vendeurId;
    const cibleId = vendeur?.id || vendeur?._id || vendeur;
    try {
      await api.post('/avis', {
        cibleId,
        note: Number(note),
        commentaire,
        contexte: { type: 'commande', refId: reviewing.id || reviewing._id },
      });
      toast.success('Merci, votre avis sera publié après modération');
      setReviewing(null);
      setCommentaire('');
      setNote(5);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Avis impossible');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Demandes Marketplace"
        title="Vos mises en relation commerciales."
        description="BTB transmet vos demandes sans commission. Les prix, paiements, livraisons et garanties sont convenus directement avec chaque entreprise."
        actions={<Link to="/dashboard/materiaux" className="btn-orange btn-sm">Voir la Marketplace</Link>}
        stats={[
          { label: 'Demandes', value: commandes.length },
          { label: 'Prises de contact', value: commandes.filter((c) => c.statut === 'prise_de_contact').length },
          { label: 'Finalisées', value: commandes.filter((c) => c.statut === 'finalisee').length },
          { label: 'Commission', value: '0 %' },
        ]}
      />
      <div className="space-y-3">
        {commandes.length === 0 && <EmptyState title="Aucune demande" description="Découvrez les produits des membres et contactez directement leur entreprise." icon="⌑" />}
        {commandes.map((c) => (
          <div key={c.id || c._id} className="card card-hover p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-gris">Demande {(c.id || c._id).slice(-8)}</p>
                <strong className="mt-1 block font-display text-xl">
                  {c.lignes?.[0]?.vendeurId?.entreprise || 'Entreprise membre'}
                </strong>
                <p className="mt-1 text-xs text-gris">
                  {c.lignes?.[0]?.vendeurId?.telephone} · {c.lignes?.[0]?.vendeurId?.email}
                </p>
              </div>
              <StatusBadge value={c.statut} />
            </div>
            <div className="mt-4 rounded-2xl bg-fond-doux p-4">
              {c.lignes?.map((ligne) => (
                <div key={ligne.id || ligne._id || ligne.produitId} className="flex justify-between gap-3 text-sm">
                  <span><strong>{ligne.quantite} ×</strong> {ligne.nom}</span>
                  <span className="font-bold">{formatFcfa(ligne.sousTotal)}</span>
                </div>
              ))}
              <div className="mt-3 flex justify-between border-t border-filet pt-3 text-sm font-extrabold">
                <span>Montant indicatif</span><span className="text-bleu">{formatFcfa(c.total)}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.statut === 'prise_de_contact' && (
                <button type="button" className="btn-line btn-sm" onClick={() => finaliser(c.id || c._id)}>Clôturer l’échange</button>
              )}
              {c.statut === 'finalisee' && (
                <button type="button" className="btn-orange btn-sm" onClick={() => setReviewing(c)}>Noter l’entreprise</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviewing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm">
          <form className="card w-full max-w-md p-6" onSubmit={envoyerAvis}>
            <p className="eyebrow">Retour d’expérience</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">Noter la qualité du service</h2>
            <label className="label mt-5">Note</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" className={`grid h-11 w-11 place-items-center rounded-xl text-lg ${value <= note ? 'bg-orange text-white' : 'bg-fond-doux text-gris'}`} onClick={() => setNote(value)}>★</button>
              ))}
            </div>
            <label className="label mt-5">Votre avis</label>
            <textarea required minLength={10} rows={4} className="input" value={commentaire} onChange={(event) => setCommentaire(event.target.value)} placeholder="Décrivez la qualité du produit, de l’accueil ou du service…" />
            <div className="mt-5 flex gap-2">
              <button type="button" className="btn-line" onClick={() => setReviewing(null)}>Annuler</button>
              <button type="submit" className="btn-orange">Envoyer l’avis</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
