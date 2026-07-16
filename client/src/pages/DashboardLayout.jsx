import { useAuthStore } from '../store/authStore';
import { droitsClient } from '../lib/constants';
import AppShell from '../components/layout/AppShell';
import { Icon } from '../components/ui/icons';

export default function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const droits = droitsClient(user?.palier);
  const isMo = user?.profilType === 'maitre_ouvrage';

  const principal = {
    heading: 'Principal',
    items: [
      { to: '/dashboard', end: true, label: 'Tableau de bord', icon: Icon.grid({}) },
      { to: '/dashboard/ma-fiche', label: 'Ma fiche', icon: Icon.user({}) },
      { to: '/dashboard/adhesion', label: 'Mon adhésion', icon: Icon.card({}) },
    ],
  };
  if (!isMo) {
    principal.items.push({ to: '/dashboard/labellisation', label: 'Labellisation', icon: Icon.badge({}) });
  }

  const activiteItems = [
    { to: '/dashboard/appels-offres', label: "Appels d'offres", icon: Icon.doc({}) },
  ];
  if (isMo) {
    activiteItems.push({ to: '/dashboard/mes-ao', label: 'Mes besoins', icon: Icon.folder({}) });
  } else {
    activiteItems.push({ to: '/dashboard/mes-reponses', label: 'Mes candidatures', icon: Icon.send({}) });
    activiteItems.push({ to: '/dashboard/mes-ao', label: 'AO reçus', icon: Icon.folder({}) });
  }
  activiteItems.push({
    to: droits.messagerie ? '/dashboard/messagerie' : '/dashboard/adhesion',
    label: droits.messagerie ? 'Messagerie' : 'Messagerie (Standard+)',
    icon: Icon.chat({}),
  });
  const activite = { heading: 'Activité', items: activiteItems };

  const commerceItems = [];
  if (droits.boutique) {
    commerceItems.push({ to: '/dashboard/boutique', label: 'Ma boutique', icon: Icon.store({}) });
  }
  commerceItems.push(
    { to: '/dashboard/commandes', label: 'Mes commandes', icon: Icon.cart({}) },
    { to: '/dashboard/materiaux', label: 'Marketplace', icon: Icon.bag({}) },
    { to: '/dashboard/formations', label: 'Formations', icon: Icon.book({}) },
  );
  const commerce = { heading: 'Commerce & montée en compétences', items: commerceItems };

  const decouvrir = {
    heading: 'Découvrir',
    items: [{ to: '/annuaire', label: 'Annuaire', icon: Icon.users({}) }],
  };

  const compte = {
    heading: 'Compte',
    items: [{ to: '/dashboard/securite', label: 'Mot de passe', icon: Icon.shield({}) }],
  };

  const sections = [principal, activite, commerce, decouvrir, compte];

  return <AppShell brand="Espace membre" title="Mon espace" sections={sections} accent="bleu" />;
}
