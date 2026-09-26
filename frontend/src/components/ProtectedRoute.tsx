import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { clearSession, hasValidSession } from '@/lib/session';

export function ProtectedRoute() {
  const location = useLocation();

  if (!hasValidSession()) {
    clearSession();
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
