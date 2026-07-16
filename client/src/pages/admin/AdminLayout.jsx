import AppShell from '../../components/layout/AppShell';
import { Icon } from '../../components/ui/icons';

const sections = [
  {
    heading: 'Centre de pilotage',
    items: [{ to: '/admin', end: true, label: 'Vue d’ensemble', icon: Icon.chart({}) }],
  },
  {
    heading: 'Académie BTB',
    items: [
      { to: '/admin/formations', label: 'Formations & formateurs', icon: Icon.book({}) },
      { to: '/admin/formulaires-label', label: 'Parcours & labels', icon: Icon.book({}) },
    ],
  },
  {
    heading: 'Communauté',
    items: [
      { to: '/admin/dossiers', label: 'Dossiers', icon: Icon.folder({}) },
      { to: '/admin/membres', label: 'Membres', icon: Icon.users({}) },
    ],
  },
  {
    heading: 'Qualité & conformité',
    items: [
      { to: '/admin/moderation', label: 'Modération', icon: Icon.shield({}) },
      { to: '/admin/audit', label: 'Audit', icon: Icon.list({}) },
    ],
  },
  {
    heading: 'Compte',
    items: [{ to: '/admin/securite', label: 'Mot de passe', icon: Icon.shield({}) }],
  },
];

export default function AdminLayout() {
  return <AppShell brand="Back-office" title="Administration" sections={sections} accent="orange" />;
}
