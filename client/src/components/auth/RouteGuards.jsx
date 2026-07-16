import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function PrivateRoute({ children, allowPending = true }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }

  if (!allowPending && user.statut !== 'actif' && user.role !== 'admin' && user.role !== 'superadmin') {
    const redirect =
      user.statut === 'pending_otp'
        ? '/inscription?etape=otp'
        : user.statut === 'pending_charte'
          ? '/inscription?etape=charte'
          : user.statut === 'pending_paiement'
            ? '/inscription?etape=paiement'
            : '/connexion';
    return <Navigate to={redirect} replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!accessToken || !user) {
    return <Navigate to="/admin/connexion" replace />;
  }
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function TrainerRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  if (!accessToken || !user) {
    return <Navigate to="/formateur/connexion" replace />;
  }
  if (user.role !== 'formateur') {
    return <Navigate to={['admin', 'superadmin'].includes(user.role) ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

export function GuestRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken && user?.statut === 'actif') {
    return (
      <Navigate
        to={
          ['admin', 'superadmin'].includes(user.role)
            ? '/admin'
            : user.role === 'formateur'
              ? '/formateur'
              : '/dashboard'
        }
        replace
      />
    );
  }
  return children;
}
