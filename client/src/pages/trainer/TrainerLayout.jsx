import AppShell from '../../components/layout/AppShell';
import { Icon } from '../../components/ui/icons';

const sections = [
  {
    heading: 'Pilotage',
    items: [{ to: '/formateur', end: true, label: 'Vue d’ensemble', icon: Icon.chart({}) }],
  },
  {
    heading: 'Pédagogie',
    items: [
      { to: '/formateur/formations', label: 'Mes formations', icon: Icon.book({}) },
      { to: '/formateur/corrections', label: 'Examens à corriger', icon: Icon.doc({}) },
    ],
  },
  {
    heading: 'Compte',
    items: [{ to: '/formateur/securite', label: 'Mot de passe', icon: Icon.shield({}) }],
  },
];

export default function TrainerLayout() {
  return <AppShell brand="Académie BTB" title="Espace formateur" sections={sections} accent="bleu" />;
}
