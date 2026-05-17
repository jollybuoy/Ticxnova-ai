import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthLoadingScreen } from './AuthLoadingScreen';

export function GuestRoute({ children }) {
  const { initializing, isAuthenticated } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <AuthLoadingScreen message="Checking session…" />;
  }

  if (isAuthenticated) {
    const redirectTo = location.state?.from ?? '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
