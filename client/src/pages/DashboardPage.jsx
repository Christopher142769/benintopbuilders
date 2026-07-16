import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { droitsClient, labelPalier } from '../lib/constants';
import { Icon } from '../components/ui/icons';

function tilesFor(user) {
  const droits = droitsClient(user?.palier);
  const isMo = user?.profilType === 'maitre_ouvrage';
  const isFournisseur = user?.profilType === 'fournisseur';
  const items = [
    { to: '/dashboard/ma-fiche', title: 'Ma fiche', desc: isMo ? 'Présentation et coordonnées' : 'Logo, présentation, géolocalisation, références', icon: Icon.user({}) },
    { to: '/dashboard/adhesion', title: 'Mon adhésion', desc: `Formule ${labelPalier(user?.palier)} — renouvellement`, icon: Icon.card({}) },
    { to: '/appels-offres', title: "Appels d'offres", desc: isMo ? 'Publier vos besoins' : 'Candidater aux opportunités', icon: Icon.doc({}) },
  ];
  if (!isMo) items.splice(1, 0, { to: '/dashboard/labellisation', title: 'Labellisation', desc: 'Bronze / Argent / Or', icon: Icon.badge({}) });
  if (droits.messagerie) items.push({ to: '/dashboard/messagerie', title: 'Messagerie', desc: 'Conversations professionnelles', icon: Icon.chat({}) });
  else items.push({ to: '/dashboard/adhesion', title: 'Messagerie (Standard+)', desc: 'Passez Standard pour échanger', icon: Icon.chat({}) });
  if (isMo) items.push({ to: '/dashboard/mes-ao', title: 'Mes besoins', desc: 'Suivi des réponses reçues', icon: Icon.folder({}) });
  else {
    items.push({ to: '/dashboard/mes-reponses', title: 'Mes candidatures', desc: 'Suivi des offres déposées', icon: Icon.send({}) });
    items.push({ to: '/dashboard/mes-ao', title: 'AO reçus', desc: 'Gérer les réponses', icon: Icon.folder({}) });
  }
  if (droits.boutique || isFournisseur) items.push({ to: '/dashboard/boutique', title: 'Ma boutique', desc: 'Produits, stock et ventes', icon: Icon.store({}) });
  items.push(
    { to: '/dashboard/commandes', title: 'Mes demandes', desc: 'Échanges marketplace', icon: Icon.cart({}) },
    { to: '/dashboard/materiaux', title: 'Marketplace', desc: 'Produits des membres', icon: Icon.bag({}) },
    { to: '/formations', title: 'Formations', desc: 'Monter en compétences', icon: Icon.book({}) },
  );
  return items;
}

const STATUT_LABEL = { actif: 'Actif', expire: 'Expiré', pending_otp: 'À valider (OTP)', pending_charte: 'Charte à signer', pending_paiement: 'Paiement en attente' };

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const tiles = tilesFor(user);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">Tableau de bord</p>
      <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">
        Bonjour {user?.prenom || user?.entreprise || 'membre'} 👋
      </h2>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`chip ${user?.statut === 'actif' ? 'chip-green' : user?.statut === 'expire' ? 'chip-orange' : ''}`}>
          {STATUT_LABEL[user?.statut] || user?.statut || '—'}
        </span>
        {user?.palier && <span className="chip">Formule {labelPalier(user.palier)}</span>}
        {user?.profilType && <span className="chip">{user.profilType.replace(/_/g, ' ')}</span>}
        {user?.label?.niveau && <span className="chip-orange">Label {user.label.niveau}</span>}
      </div>

      {user?.statut === 'expire' && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-orange/30 bg-orange-soft p-5">
          <p className="text-sm font-bold text-orange-dark">Adhésion expirée — votre fiche est masquée dans l&apos;annuaire.</p>
          <Link to="/dashboard/adhesion?reactiver=1" className="btn-orange btn-sm">Réactiver</Link>
        </div>
      )}
      {user?.palier === 'business' && user?.commercialDemandeAt && (
        <div className="mt-6 rounded-card border border-filet bg-bleu-soft p-5 text-sm font-bold text-bleu">
          Demande Business enregistrée — un conseiller vous recontacte pour le devis à la carte.
        </div>
      )}

      <h3 className="mt-10 text-sm font-extrabold uppercase tracking-[0.14em] text-gris">Accès rapide</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((item) => (
          <Link key={item.to + item.title} to={item.to} className="card card-hover group block p-5">
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-bleu-soft text-bleu">{item.icon}</span>
              <span className="text-gris transition group-hover:translate-x-1 group-hover:text-orange">{Icon.arrowRight({ className: 'h-5 w-5' })}</span>
            </div>
            <div className="mt-4 text-lg font-extrabold">{item.title}</div>
            <p className="mt-1 text-sm text-gris">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
