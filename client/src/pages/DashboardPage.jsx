import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    clearSession();
    toast.success('Déconnecté');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <p className="eyebrow">Tableau de bord</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
        Bonjour {user?.prenom || user?.entreprise || 'membre'}
      </h1>
      <p className="mt-2 max-w-xl text-black/65">
        Compte <strong>{user?.statut}</strong>
        {user?.palier ? ` · palier ${user.palier}` : ''}
        {user?.label?.niveau ? ` · label ${user.label.niveau}` : ''}.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: '/dashboard/ma-fiche', title: 'Ma fiche', desc: 'Logo, présentation, géoloc, références' },
          { to: '/annuaire', title: 'Annuaire', desc: 'Consulter les professionnels' },
          { to: '/appels-offres', title: 'Appels d\'offres', desc: 'Besoins et réponses' },
          { to: '/materiaux', title: 'Matériaux', desc: 'Marketplace fournisseurs' },
          { to: '/formations', title: 'Formations', desc: 'Monter en compétences' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="card block p-5 transition hover:-translate-y-0.5">
            <div className="font-display text-lg font-extrabold">{item.title}</div>
            <p className="mt-1 text-sm text-black/60">{item.desc}</p>
          </Link>
        ))}
      </div>

      <button type="button" onClick={logout} className="btn-line mt-10">
        Se déconnecter
      </button>
    </div>
  );
}
