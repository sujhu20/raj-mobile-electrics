import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { ROLES, ROUTES } from '../config/constants';
import { LoadingSpinner } from '../components/ui/Skeletons';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth);

  // While profile is loading, show spinner (prevents flash redirect)
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <>{children}</>;
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  if (isAuthenticated) {
    if (user?.role === ROLES.ADMIN) return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return <>{children}</>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAppSelector((s) => s.auth);

  // While profile is loading, show spinner (prevents redirect before user data arrives)
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  // Only redirect non-admin if user data has actually loaded (user !== null)
  if (user && user.role !== ROLES.ADMIN) return <Navigate to={ROUTES.HOME} replace />;

  // If user is null but authenticated (token exists, profile not yet fetched), wait
  if (!user) return <LoadingSpinner />;

  return <>{children}</>;
}
