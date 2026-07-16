import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from './NotificationBell';
import Logo from '../ui/Logo';

const links = [
  { to: '/annuaire', label: 'Annuaire' },
  { to: '/appels-offres', label: "Appels d'offres" },
  { to: '/materiaux', label: 'Marketplace' },
  { to: '/formations', label: 'Formations' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const authed = accessToken && user;

  return (
    <header className="sticky top-0 z-50 border-b border-filet bg-fond-doux/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-8">
        <Logo size="md" />

        <div className="hidden items-center gap-1 rounded-pill border border-filet bg-white p-1.5 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-pill px-4 py-2 text-sm font-bold transition ${
                  isActive ? 'bg-bleu-soft text-bleu' : 'text-ink hover:bg-bleu-soft hover:text-bleu'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {authed ? (
            <>
              <NotificationBell />
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <Link to="/admin" className="btn-line btn-sm">Admin</Link>
              )}
              <Link to="/dashboard" className="btn-ink btn-sm">Mon espace</Link>
            </>
          ) : (
            <>
              <Link to="/connexion" className="btn-line btn-sm">Connexion</Link>
              <Link to="/inscription" className="btn-ink btn-sm">S&apos;inscrire</Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border-[1.5px] border-black/10 bg-white lg:hidden"
        >
          <span className="flex h-3.5 w-4 flex-col justify-between">
            <span className={`h-0.5 w-full rounded bg-ink transition ${open ? 'translate-y-[6px] rotate-45' : ''}`} />
            <span className={`h-0.5 w-3/4 rounded bg-ink transition ${open ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 w-full rounded bg-ink transition ${open ? '-translate-y-[6px] -rotate-45' : ''}`} />
          </span>
        </button>
      </nav>

      {open && (
        <div className="border-t border-filet bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-base font-bold ${isActive ? 'bg-bleu-soft text-bleu' : 'hover:bg-bleu-soft'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-filet pt-4">
            {authed ? (
              <button type="button" className="btn-ink w-full" onClick={() => { setOpen(false); navigate('/dashboard'); }}>
                Mon espace
              </button>
            ) : (
              <>
                <Link to="/connexion" onClick={() => setOpen(false)} className="btn-line w-full">Connexion</Link>
                <Link to="/inscription" onClick={() => setOpen(false)} className="btn-orange w-full">S&apos;inscrire</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
