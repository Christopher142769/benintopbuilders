import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { formatFcfa } from '../lib/constants';
import { EmptyState, Field, PageHeader, SectionCard, StatusBadge } from '../components/ui/PageKit';

const CATS = ['ciment', 'fer', 'carrelage', 'peinture', 'agregats', 'toiture', 'quincaillerie', 'equipement', 'outillage', 'services', 'immobilier', 'autre'];
const EMPTY_FORM = {
  nom: '',
  categorie: 'ciment',
  prixUnitaire: '',
  stock: '',
  description: '',
  unite: 'unité',
};

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
  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tab, setTab] = useState('produits');

  async function createProduit(e) {
    e.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (photo) payload.append('photo', photo);
      if (editingId) await api.patch(`/materiaux/boutique/${editingId}`, payload);
      else await api.post('/materiaux/boutique', payload);
      toast.success(editingId ? 'Produit modifié' : 'Produit ajouté');
      setForm(EMPTY_FORM);
      setPhoto(null);
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ['boutique'] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    }
  }

  function editProduit(produit) {
    setEditingId(produit.id || produit._id);
    setForm({
      nom: produit.nom,
      categorie: produit.categorie,
      prixUnitaire: produit.prixUnitaire,
      stock: produit.stock,
      description: produit.description || '',
      unite: produit.unite || 'unité',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteProduit(produit) {
    if (!window.confirm(`Retirer « ${produit.nom} » de la Marketplace ?`)) return;
    await api.delete(`/materiaux/boutique/${produit.id || produit._id}`);
    toast.success('Produit retiré');
    qc.invalidateQueries({ queryKey: ['boutique'] });
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
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Vitrine société"
        title="Présentez vos produits. Échangez directement."
        description="Publiez vos offres auprès de tous les membres BTB. Aucune commission : la négociation et la vente se déroulent hors plateforme."
        stats={[
          { label: 'Produits publiés', value: produits.length },
          { label: 'Demandes reçues', value: ventes.length },
          { label: 'Commission', value: '0 %' },
          { label: 'Canal', value: 'Direct' },
        ]}
      />

      <div className="flex gap-2 rounded-pill border border-filet bg-white p-1.5">
        <button type="button" className={`flex-1 rounded-pill px-4 py-2 text-sm font-extrabold ${tab === 'produits' ? 'bg-ink text-white' : ''}`} onClick={() => setTab('produits')}>
          Mes produits
        </button>
        <button type="button" className={`flex-1 rounded-pill px-4 py-2 text-sm font-extrabold ${tab === 'demandes' ? 'bg-ink text-white' : ''}`} onClick={() => setTab('demandes')}>
          Demandes reçues ({ventes.length})
        </button>
      </div>

      {tab === 'produits' && (
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <SectionCard title={editingId ? 'Modifier le produit' : 'Ajouter un produit'} description="Le prix et le stock sont indicatifs et seront confirmés directement.">
            <form onSubmit={createProduit} className="space-y-4">
              <Field label="Nom du produit ou service">
                <input required className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              </Field>
              <Field label="Catégorie">
                <select className="input capitalize" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prix indicatif">
                  <input required min="0" type="number" className="input" value={form.prixUnitaire} onChange={(e) => setForm({ ...form, prixUnitaire: e.target.value })} />
                </Field>
                <Field label="Disponibilité">
                  <input required min="0" type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </Field>
              </div>
              <Field label="Unité">
                <input className="input" placeholder="unité, sac, tonne…" value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} />
              </Field>
              <Field label="Description">
                <textarea rows={4} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label="Photo du produit" hint={editingId ? 'Laissez vide pour conserver la photo actuelle.' : 'JPG, PNG ou WebP.'}>
                <input type="file" accept="image/*" className="input file:mr-3 file:rounded-pill file:border-0 file:bg-ink file:px-3 file:py-2 file:text-xs file:font-bold file:text-white" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
              </Field>
              <div className="flex gap-2">
                {editingId && <button type="button" className="btn-line btn-sm" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setPhoto(null); }}>Annuler</button>}
                <button type="submit" className="btn-orange btn-sm flex-1">{editingId ? 'Enregistrer' : 'Publier'}</button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title={`Catalogue de votre société (${produits.length})`}>
            {produits.length === 0 ? (
              <EmptyState title="Aucun produit publié" description="Ajoutez votre première offre pour la rendre visible dans la Marketplace." icon="＋" />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {produits.map((p) => (
                  <article key={p.id || p._id} className="rounded-[22px] border border-filet p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="chip capitalize">{p.categorie}</span>
                        <h3 className="mt-3 font-display text-lg font-extrabold">{p.nom}</h3>
                        <p className="mt-1 text-sm font-extrabold text-bleu">{formatFcfa(p.prixUnitaire)}</p>
                        <p className="mt-1 text-xs text-gris">Disponibilité indicative : {p.stock} {p.unite}</p>
                      </div>
                      <StatusBadge value={p.actif ? 'actif' : 'inactif'} />
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-filet pt-3">
                      <button type="button" className="btn-line btn-sm flex-1" onClick={() => editProduit(p)}>Modifier</button>
                      <button type="button" className="btn-ghost btn-sm text-orange" onClick={() => deleteProduit(p)}>Retirer</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {tab === 'demandes' && (
        <SectionCard title="Demandes reçues" description="Contactez l’acheteur hors plateforme pour convenir du prix, du paiement et de la livraison.">
          {ventes.length === 0 ? (
            <EmptyState title="Aucune demande reçue" description="Les demandes envoyées depuis vos produits apparaîtront ici." icon="◇" />
          ) : (
            <div className="space-y-3">
              {ventes.map((c) => (
                <article key={c.id || c._id} className="rounded-[22px] border border-filet p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wide text-gris">Demande {(c.id || c._id).slice(-8)}</p>
                      <h3 className="mt-1 font-display text-lg font-extrabold">
                        {c.acheteurId?.entreprise || `${c.acheteurId?.prenom || ''} ${c.acheteurId?.nom || ''}`}
                      </h3>
                      <p className="mt-1 text-sm text-gris">{c.acheteurId?.telephone} · {c.acheteurId?.email}</p>
                    </div>
                    <StatusBadge value={c.statut} />
                  </div>
                  <div className="mt-4 rounded-2xl bg-fond-doux p-4">
                    {c.lignes.map((ligne) => <p key={ligne.id || ligne._id || ligne.produitId} className="text-sm"><strong>{ligne.quantite} × {ligne.nom}</strong> · {formatFcfa(ligne.sousTotal)}</p>)}
                    {c.message && <p className="mt-3 border-t border-filet pt-3 text-sm text-gris">“{c.message}”</p>}
                  </div>
                  {c.statut === 'demande_envoyee' && (
                    <button type="button" className="btn-orange btn-sm mt-4" onClick={() => setStatut(c.id || c._id, 'prise_de_contact')}>
                      Confirmer la prise de contact
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
