import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuthStore } from '../../store/authStore';

export default function MainLayout() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authenticated = Boolean(user && accessToken);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <Navbar />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span className="ambient-orb ambient-orb-blue" />
        <span className="ambient-orb ambient-orb-orange" />
      </div>
      <main key={location.pathname} className="page-enter flex-1">
        <Outlet />
      </main>
      {!authenticated && <Footer />}
    </div>
  );
}
