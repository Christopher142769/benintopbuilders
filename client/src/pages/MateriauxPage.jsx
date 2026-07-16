import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { EmptyState, PageHeader } from '../components/ui/PageKit';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';

const CATS = [
  'ciment',
  'fer',
  'carrelage',
  'peinture',
  'agregats',
  'toiture',
  'quincaillerie',
  'equipement',
  'outillage',
  'services',
  'immobilier',
  'autre',
];

export default function MateriauxPage() {
  const [q, setQ] = useState('');
  const [categorie, setCategorie] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const cart = useCartStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data = [], isLoading } = useQuery({
    queryKey: ['produits', q, categorie],
    queryFn: async () => {
      const { data: res } = await api.get('/materiaux/produits', {
        params: { q: q || undefined, categorie: categorie || undefined },
      });
      return res.data;
    },
  });

  const count = cart.items.reduce((s, i) => s + i.quantite, 0);

  async function envoyerDemande(e) {
    e.preventDefault();
    if (!user) {
      navigate('/connexion');
      return;
    }
    const fd = new FormData(e.target);
    try {
      await api.post('/materiaux/commandes', {
        lignes: cart.items.map((i) => ({ produitId: i.produitId, quantite: i.quantite })),
        adresseLivraison: {
          nom: fd.get('nom'),
          telephone: fd.get('telephone'),
          ville: fd.get('ville'),
          quartier: fd.get('quartier'),
          details: fd.get('details'),
        },
        message: fd.get('message'),
      });
      cart.clear();
      setCheckout(false);
      setDrawer(false);
      toast.success('Demande envoyée aux entreprises concernées');
      navigate('/dashboard/commandes');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Envoi impossible');
    }
  }

  async function contacter(produit) {
    if (!user) {
      navigate('/connexion');
      return;
    }
    if (user.palier === 'decouverte') {
      toast.error('La messagerie est disponible dès la formule Standard');
      navigate('/dashboard/adhesion');
      return;
    }
    const participantId = produit.vendeurId?.id || produit.vendeurId?._id;
    if (!participantId || participantId === (user.id || user._id)) {
      toast.error('Vous ne pouvez pas ouvrir une conversation avec votre propre société');
      return;
    }
    try {
      const { data: response } = await api.post('/messagerie', {
        participantId,
        contexte: {
          type: 'general',
          refId: produit._id,
          label: `Marketplace · ${produit.nom}`,
        },
      });
      navigate(`/dashboard/messagerie?msg=${response.data._id || response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Conversation impossible');
    }
  }

  function ajouterDemande(produit) {
    if (!user) {
      navigate('/connexion');
      return;
    }
    if (user.palier === 'decouverte') {
      toast.error('La Marketplace est disponible dès la formule Standard');
      navigate('/dashboard/adhesion');
      return;
    }
    cart.addItem(produit);
    toast.success('Ajouté à votre demande');
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Produits & entreprises"
        title="Marketplace Bénin Top Builders."
        description="Découvrez les produits des membres, envoyez une demande ou échangez directement. La négociation, le paiement et la livraison se font hors plateforme."
        actions={<button type="button" className="btn-orange" onClick={() => setDrawer(true)}>
          Panier ({count})
        </button>}
        stats={[
          { label: 'Produits', value: data.length },
          { label: 'Dans le panier', value: count },
          { label: 'Commission BTB', value: '0 %' },
          { label: 'Transaction', value: 'Hors plateforme' },
        ]}
      />

      <div className="card flex flex-wrap gap-2 p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher…"
          className="rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-2.5 text-sm"
        />
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategorie(categorie === c ? '' : c)}
            className={`rounded-pill px-3 py-1.5 text-xs font-extrabold capitalize ${
              categorie === c ? 'bg-bleu text-white' : 'bg-fond-doux'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <div className="card h-40 animate-pulse bg-fond-doux sm:col-span-2" />}
        {!isLoading && data.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState title="Aucun produit publié" description="Le catalogue se remplira lorsque les membres Standard et supérieurs présenteront leurs offres." icon="▧" />
          </div>
        )}
        {data.map((p) => (
          <article key={p._id} className="card card-hover flex flex-col overflow-hidden">
            <div className="h-36 bg-gradient-to-br from-bleu-soft via-white to-orange-soft">
              {p.photos?.[0] && <img src={p.photos[0]} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-1 flex-col p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="chip capitalize">{p.categorie}</span>
              <span className="text-[10px] font-bold text-gris">Stock indicatif : {p.stock}</span>
            </div>
            <h2 className="font-display text-lg font-extrabold">{p.nom}</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-gris">{p.description || 'Produit proposé par un membre BTB.'}</p>
            <p className="mt-3 font-extrabold text-bleu">{formatFcfa(p.prixUnitaire)}</p>
            <div className="mt-3 rounded-2xl bg-fond-doux p-3">
              <p className="text-xs font-extrabold">{p.vendeurId?.entreprise || `${p.vendeurId?.prenom || ''} ${p.vendeurId?.nom || ''}`}</p>
              <p className="mt-1 text-[10px] text-gris">{p.vendeurId?.ville || 'Bénin'} · Formule {p.vendeurId?.palier}</p>
            </div>
            {(p.vendeurId?.id || p.vendeurId?._id) !== (user?.id || user?._id) ? (
            <div className="mt-auto flex gap-2 pt-4">
              <button
                type="button"
                className="btn-ink btn-sm flex-1"
                onClick={() => ajouterDemande(p)}
              >
                Demander
              </button>
              <button type="button" className="btn-line btn-sm" onClick={() => contacter(p)}>
                Écrire
              </button>
            </div>
            ) : (
              <Link to="/dashboard/boutique" className="btn-line btn-sm mt-auto !mt-4">Gérer ce produit</Link>
            )}
            </div>
          </article>
        ))}
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/40">
          <div className="flex h-full w-full max-w-md flex-col bg-white p-6 shadow-lift">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl font-extrabold">Votre demande</h3>
                <p className="mt-1 text-xs text-gris">Sans paiement sur BTB</p>
              </div>
              <button type="button" className="btn-line !px-3 !py-2 text-sm" onClick={() => setDrawer(false)}>
                Fermer
              </button>
            </div>
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
              {cart.items.length === 0 && <p className="text-sm text-black/55">Panier vide.</p>}
              {cart.items.map((i) => (
                <div key={i.produitId} className="rounded-2xl bg-fond-doux p-3 text-sm">
                  <div className="font-bold">{i.nom}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" className="rounded-full bg-white px-2" onClick={() => cart.setQty(i.produitId, i.quantite - 1)}>−</button>
                    <span className="font-extrabold">{i.quantite}</span>
                    <button type="button" className="rounded-full bg-white px-2" onClick={() => cart.setQty(i.produitId, i.quantite + 1)}>+</button>
                    <span className="ml-auto">{formatFcfa(i.prixUnitaire * i.quantite)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-filet pt-4 text-sm">
              <div className="flex justify-between"><span>Sous-total</span><strong>{formatFcfa(cart.sousTotal())}</strong></div>
              <div className="mt-1 flex justify-between text-black/60"><span>Commission BTB</span><strong>0 %</strong></div>
              <div className="mt-2 flex justify-between text-base font-extrabold"><span>Montant indicatif</span><span className="text-bleu">{formatFcfa(cart.sousTotal())}</span></div>
              <p className="mt-3 rounded-2xl bg-orange-soft p-3 text-xs leading-5 text-orange-dark">
                BTB transmet uniquement votre demande. Prix final, paiement, livraison et garanties sont convenus directement avec chaque entreprise.
              </p>
              {!checkout ? (
                <button type="button" className="btn-orange mt-4 w-full" disabled={!cart.items.length} onClick={() => setCheckout(true)}>
                  Commander
                </button>
              ) : (
                <form className="mt-4 space-y-2" onSubmit={envoyerDemande}>
                  <input name="nom" required placeholder="Nom" className="w-full rounded-2xl border px-3 py-2" defaultValue={user?.prenom || ''} />
                  <input name="telephone" required placeholder="Téléphone" className="w-full rounded-2xl border px-3 py-2" defaultValue={user?.telephone || ''} />
                  <input name="ville" required placeholder="Ville" className="w-full rounded-2xl border px-3 py-2" />
                  <input name="quartier" placeholder="Quartier" className="w-full rounded-2xl border px-3 py-2" />
                  <textarea name="details" placeholder="Précisions" className="w-full rounded-2xl border px-3 py-2" rows={2} />
                  <textarea name="message" placeholder="Message pour les entreprises" className="w-full rounded-2xl border px-3 py-2" rows={3} />
                  <button type="submit" className="btn-orange w-full">Envoyer la demande</button>
                </form>
              )}
              {['standard', 'premium', 'access', 'business'].includes(user?.palier) && (
                <Link to="/dashboard/boutique" className="mt-3 block text-center text-sm font-bold text-bleu">Ma boutique →</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
