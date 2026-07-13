import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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

  async function doCheckout(e) {
    e.preventDefault();
    if (!user) {
      navigate('/connexion');
      return;
    }
    const fd = new FormData(e.target);
    try {
      const { data: res } = await api.post('/materiaux/commandes', {
        lignes: cart.items.map((i) => ({ produitId: i.produitId, quantite: i.quantite })),
        adresseLivraison: {
          nom: fd.get('nom'),
          telephone: fd.get('telephone'),
          ville: fd.get('ville'),
          quartier: fd.get('quartier'),
          details: fd.get('details'),
        },
      });
      cart.clear();
      setCheckout(false);
      setDrawer(false);
      toast.success('Commande créée');
      if (res.data.checkoutUrl) {
        navigate(res.data.checkoutUrl.replace(/^https?:\/\/[^/]+/, '') || `/paiement/retour?ref=${res.data.paiement?.refInterne}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Checkout impossible');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Marketplace</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Matériaux</h1>
          <p className="mt-2 text-black/65">Catalogue fournisseurs · frais de service 3 % · paiement FSPay</p>
        </div>
        <button type="button" className="btn-orange" onClick={() => setDrawer(true)}>
          Panier ({count})
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <div className="card h-40 animate-pulse bg-fond-doux sm:col-span-2" />}
        {data.map((p) => (
          <article key={p._id} className="card flex flex-col p-5">
            <h2 className="font-display text-lg font-extrabold">{p.nom}</h2>
            <p className="mt-1 text-xs capitalize text-black/50">{p.categorie} · stock {p.stock}</p>
            <p className="mt-3 font-extrabold text-bleu">{formatFcfa(p.prixUnitaire)}</p>
            <button
              type="button"
              className="btn-ink mt-auto !mt-4 !px-4 !py-2 text-sm"
              onClick={() => {
                cart.addItem(p);
                toast.success('Ajouté au panier');
              }}
            >
              Ajouter
            </button>
          </article>
        ))}
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/40">
          <div className="flex h-full w-full max-w-md flex-col bg-white p-6 shadow-lift">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-extrabold">Panier</h3>
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
              <div className="mt-1 flex justify-between text-black/60"><span>Frais de service 3 %</span><span>{formatFcfa(cart.fraisService())}</span></div>
              <div className="mt-2 flex justify-between text-base font-extrabold"><span>Total</span><span className="text-bleu">{formatFcfa(cart.total())}</span></div>
              {!checkout ? (
                <button type="button" className="btn-orange mt-4 w-full" disabled={!cart.items.length} onClick={() => setCheckout(true)}>
                  Commander
                </button>
              ) : (
                <form className="mt-4 space-y-2" onSubmit={doCheckout}>
                  <input name="nom" required placeholder="Nom" className="w-full rounded-2xl border px-3 py-2" defaultValue={user?.prenom || ''} />
                  <input name="telephone" required placeholder="Téléphone" className="w-full rounded-2xl border px-3 py-2" defaultValue={user?.telephone || ''} />
                  <input name="ville" required placeholder="Ville" className="w-full rounded-2xl border px-3 py-2" />
                  <input name="quartier" placeholder="Quartier" className="w-full rounded-2xl border px-3 py-2" />
                  <textarea name="details" placeholder="Précisions" className="w-full rounded-2xl border px-3 py-2" rows={2} />
                  <button type="submit" className="btn-orange w-full">Payer via FSPay</button>
                </form>
              )}
              {user?.palier === 'fournisseur' && (
                <Link to="/dashboard/boutique" className="mt-3 block text-center text-sm font-bold text-bleu">Ma boutique →</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
