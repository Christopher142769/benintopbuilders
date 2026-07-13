import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';

const CATS = ['ciment', 'fer', 'carrelage', 'peinture', 'agregats', 'toiture', 'quincaillerie'];

export default function BoutiquePage() {
  const qc = useQueryClient();
  const { data: produits = [] } = useQuery({
    queryKey: ['boutique'],
    queryFn: async () => (await api.get('/materiaux/boutique')).data.data,
  });
  const { data: ventes = [] } = useQuery({
    queryKey: ['ventes'],
    queryFn: async () => (await api.get('/materiaux/ventes')).data.data,
  });
  const [form, setForm] = useState({
    nom: '',
    categorie: 'ciment',
    prixUnitaire: '',
    stock: '',
    description: '',
  });

  async function createProduit(e) {
    e.preventDefault();
    try {
      await api.post('/materiaux/boutique', {
        ...form,
        prixUnitaire: Number(form.prixUnitaire),
        stock: Number(form.stock),
      });
      toast.success('Produit ajouté');
      setForm({ nom: '', categorie: 'ciment', prixUnitaire: '', stock: '', description: '' });
      qc.invalidateQueries({ queryKey: ['boutique'] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    }
  }

  async function setStatut(id, statut) {
    try {
      await api.patch(`/materiaux/commandes/${id}/statut`, { statut });
      toast.success('Statut mis à jour');
      qc.invalidateQueries({ queryKey: ['ventes'] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Transition refusée');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <p className="eyebrow">Fournisseur</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Ma boutique</h1>

      <form onSubmit={createProduit} className="card mt-8 grid gap-3 p-6 sm:grid-cols-2">
        <input required placeholder="Nom produit" className="rounded-2xl border px-4 py-3" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <select className="rounded-2xl border px-4 py-3" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input required type="number" placeholder="Prix FCFA" className="rounded-2xl border px-4 py-3" value={form.prixUnitaire} onChange={(e) => setForm({ ...form, prixUnitaire: e.target.value })} />
        <input required type="number" placeholder="Stock" className="rounded-2xl border px-4 py-3" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <textarea placeholder="Description" className="sm:col-span-2 rounded-2xl border px-4 py-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button type="submit" className="btn-orange sm:col-span-2">Ajouter le produit</button>
      </form>

      <h2 className="mt-10 font-display text-xl font-extrabold">Produits ({produits.length})</h2>
      <div className="mt-4 space-y-2">
        {produits.map((p) => (
          <div key={p._id} className="card flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span className="font-bold">{p.nom}</span>
            <span>{formatFcfa(p.prixUnitaire)} · stock {p.stock}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-extrabold">Mes ventes</h2>
      <div className="mt-4 space-y-3">
        {ventes.map((c) => (
          <div key={c._id} className="card p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{formatFcfa(c.total)}</strong>
              <span className="capitalize">{c.statut}</span>
            </div>
            {c.statut === 'payee' && (
              <button type="button" className="btn-line mt-2 !px-3 !py-1.5 text-xs" onClick={() => setStatut(c._id, 'en_preparation')}>
                En préparation
              </button>
            )}
            {c.statut === 'en_preparation' && (
              <button type="button" className="btn-orange mt-2 !px-3 !py-1.5 text-xs" onClick={() => setStatut(c._id, 'livree')}>
                Marquer livrée
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
