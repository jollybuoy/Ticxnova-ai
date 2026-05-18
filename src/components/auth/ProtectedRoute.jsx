import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { AuthLoadingScreen } from './AuthLoadingScreen';

export function ProtectedRoute({ children, allowPasswordReset = false }) {
  const { initializing, isAuthenticated, user } = useAuth();
  const { profile } = useTenant();
  const location = useLocation();
  const authMustReset = user?.user_metadata?.must_reset_password;
  const mustResetPassword =
    typeof authMustReset === 'boolean' ? authMustReset : Boolean(profile?.must_reset_password);

  if (initializing) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (mustResetPassword && !allowPasswordReset) {
    return <Navigate to="/first-login-reset" replace />;
  }

  if (!mustResetPassword && allowPasswordReset) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
