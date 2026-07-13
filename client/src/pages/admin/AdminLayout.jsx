import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', end: true, label: 'Statistiques' },
  { to: '/admin/dossiers', label: 'Dossiers' },
  { to: '/admin/membres', label: 'Membres' },
  { to: '/admin/moderation', label: 'Modération' },
  { to: '/admin/audit', label: 'Audit' },
];

export default function AdminLayout() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr] md:px-8">
      <aside className="card h-fit p-3">
        <p className="px-2 text-xs font-extrabold uppercase tracking-wide text-bleu">Back-office</p>
        <nav className="mt-3 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-2xl px-3 py-2 text-sm font-bold ${isActive ? 'bg-ink text-white' : 'hover:bg-fond-doux'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
