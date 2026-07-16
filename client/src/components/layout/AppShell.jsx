import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import Logo from '../ui/Logo';
import { Icon } from '../ui/icons';
import NotificationBell from './NotificationBell';

function initials(user) {
  const a = user?.prenom?.[0] || user?.entreprise?.[0] || user?.email?.[0] || 'M';
  const b = user?.nom?.[0] || user?.entreprise?.[1] || '';
  return (a + b).toUpperCase();
}

/**
 * Shell applicatif (espace membre / back-office) : sidebar + topbar + contenu.
 * props:
 *  - brand   : libellé de section (ex. "Espace membre", "Back-office")
 *  - title   : titre courant (topbar)
 *  - sections: [{ heading?, items: [{ to, end, label, icon, badge? }] }]
 *  - accent  : "bleu" | "orange" (couleur d'accent de la marque de section)
 */
export default function AppShell({ brand = 'Espace membre', title, sections = [], accent = 'bleu' }) {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const location = useLocation();

  async function logout() {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearSession();
    toast.success('Déconnecté');
    navigate('/');
  }

  const accentText = accent === 'orange' ? 'text-orange' : 'text-bleu';

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo to="/" size="sm" />
      </div>
      <div className="px-5">
        <span className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${accentText}`}>{brand}</span>
      </div>

      <nav className="mt-3 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {sections.map((section, i) => (
          <div key={section.heading || i}>
            {section.heading && (
              <p className="px-3 pb-1.5 pt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gris/70">
                {section.heading}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to + item.label}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}
                >
                  <span className="side-ico">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && (
                    <span className="rounded-full bg-orange px-2 py-0.5 text-[10px] font-extrabold text-white">{item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-filet p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-fond-doux p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-sm font-extrabold text-white">
            {initials(user)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user?.prenom || user?.entreprise || 'Membre'}</p>
            <p className="truncate text-xs text-gris">{user?.email}</p>
          </div>
        </div>
        <button type="button" onClick={logout} className="side-link mt-1 w-full text-orange-dark hover:bg-orange-soft hover:text-orange-dark">
          <span className="side-ico">{Icon.logout({})}</span>
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-fond-doux lg:grid lg:grid-cols-[280px_1fr]">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen border-r border-filet bg-white lg:block">
        {SidebarInner}
      </aside>

      {/* Drawer mobile */}
      {open && <div className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r border-filet bg-white transition-transform duration-300 lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {SidebarInner}
      </aside>

      {/* Colonne principale */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-filet bg-fond-doux/85 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              className="grid h-10 w-10 place-items-center rounded-xl border-[1.5px] border-black/10 bg-white lg:hidden"
            >
              {Icon.list({ className: 'h-5 w-5' })}
            </button>
            <h1 className="text-lg font-extrabold md:text-xl">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/" className="btn-line btn-sm hidden sm:inline-flex">
              {Icon.external({ className: 'h-4 w-4' })} Site
            </Link>
          </div>
        </header>

        <main key={location.pathname} className="page-enter flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
