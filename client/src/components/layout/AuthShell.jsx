import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import defaultBackground from '../../../../img.png';

const HIGHLIGHTS = [
  'Répertoire géolocalisé des professionnels du BTP',
  "Appels d'offres qualifiés & réponses illimitées",
  "Label d'excellence et vitrines fournisseurs",
];

/**
 * Coquille d'authentification — panneau marque (gauche) + contenu (droite).
 * props: eyebrow, title, subtitle, children, footer, background, highlights, panelTitle
 */
export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  background = defaultBackground,
  highlights = HIGHLIGHTS,
  panelTitle = <>Bâtissons plus haut.<br />Ensemble.</>,
}) {
  return (
    <div
      className="relative flex min-h-screen items-center overflow-hidden bg-cover bg-center px-3 py-3 sm:px-8 sm:py-8 lg:grid lg:place-items-center"
      style={{ backgroundImage: `linear-gradient(rgba(5,18,42,.38), rgba(5,18,42,.64)), url(${background})` }}
    >
      <div className="auth-stage page-enter mx-auto grid w-full max-w-6xl overflow-hidden rounded-[26px] bg-white shadow-[0_30px_100px_rgba(4,20,48,.42)] sm:rounded-[32px] lg:min-h-[680px] lg:grid-cols-[55%_45%]">
        <main className="auth-paper relative z-10 flex min-w-0 flex-col bg-white">
          <div className="flex items-center justify-end px-5 py-4 sm:px-6 sm:py-5">
            <Link to="/" className="text-xs font-extrabold text-bleu transition hover:text-orange">← Retour au site</Link>
          </div>
          <div className="flex flex-1 items-center justify-center px-5 pb-7 pt-0 sm:px-8 sm:pb-10 sm:pt-2 md:px-12 lg:pr-20">
            <div className="w-full max-w-md">
            <div className="mb-5 flex justify-center sm:mb-8">
              <Logo size="sm" />
            </div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className="mt-3 font-display text-3xl font-extrabold text-ink md:text-[2.55rem] md:leading-[1.05]">{title}</h1>
            {subtitle && <p className="mt-3 text-sm font-medium leading-6 text-gris">{subtitle}</p>}
            <div className="mt-6 sm:mt-8">{children}</div>
            {footer && <div className="mt-6 sm:mt-8">{footer}</div>}
            </div>
          </div>
        </main>

        <aside className="relative hidden overflow-hidden lg:block">
          <img src={background} alt="Bénin Top Builders" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-bleu/10" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange">Bénin Top Builders</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-[1.04]">{panelTitle}</h2>
            <ul className="mt-6 space-y-2.5">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-2 text-xs font-bold text-white/85">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-orange">✓</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
