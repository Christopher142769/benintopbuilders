import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (produit, quantite = 1) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => i.produitId === produit._id);
        if (idx >= 0) items[idx].quantite += quantite;
        else {
          items.push({
            produitId: produit._id,
            nom: produit.nom,
            prixUnitaire: produit.prixUnitaire,
            quantite,
            photo: produit.photos?.[0],
            categorie: produit.categorie,
          });
        }
        set({ items });
      },
      setQty: (produitId, quantite) => {
        if (quantite < 1) {
          set({ items: get().items.filter((i) => i.produitId !== produitId) });
          return;
        }
        set({
          items: get().items.map((i) => (i.produitId === produitId ? { ...i, quantite } : i)),
        });
      },
      remove: (produitId) => set({ items: get().items.filter((i) => i.produitId !== produitId) }),
      clear: () => set({ items: [] }),
      sousTotal: () => get().items.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0),
      fraisService: () => 0,
      total: () => get().sousTotal(),
    }),
    { name: 'btb-cart' }
  )
);
