import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

export default function Footer() {
  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.6fr_1fr_1fr_1.2fr] md:px-8">
        <div>
          <Logo to="/" variant="light" size="md" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
            L&apos;infrastructure qui met en relation les professionnels du BTP béninois avec les opportunités,
            les clients et les partenaires — dans un cadre de confiance, sans rétrocession.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange">Plateforme</h4>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link to="/annuaire" className="transition hover:text-white">Annuaire</Link></li>
            <li><Link to="/appels-offres" className="transition hover:text-white">Appels d&apos;offres</Link></li>
            <li><Link to="/materiaux" className="transition hover:text-white">Marketplace</Link></li>
            <li><Link to="/formations" className="transition hover:text-white">Formations</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange">Compte</h4>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link to="/connexion" className="transition hover:text-white">Connexion</Link></li>
            <li><Link to="/inscription" className="transition hover:text-white">Adhésion</Link></li>
            <li><Link to="/dashboard" className="transition hover:text-white">Mon espace</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange">Contact</h4>
          <p className="text-sm text-white/60">AT-Conseil Label Bénin</p>
          <p className="mt-2 text-sm text-white/60">Paiements sécurisés via FSPay · FCFA</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/40 md:px-8">
        © {new Date().getFullYear()} Bénin Top Builders — AT-Conseil Label Bénin. Tous droits réservés.
      </div>
    </footer>
  );
}
