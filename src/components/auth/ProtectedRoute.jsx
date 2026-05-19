import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { workspaceCanAccessApp } from '../../lib/tenant/verificationService';
import { AuthLoadingScreen } from './AuthLoadingScreen';

export function ProtectedRoute({
  children,
  allowPasswordReset = false,
  allowDomainVerification = false,
  allowedRoles,
}) {
  const { initializing, isAuthenticated, user } = useAuth();
  const { profile, tenant, loading: tenantLoading } = useTenant();
  const location = useLocation();
  const authMustReset = user?.user_metadata?.must_reset_password;
  const mustResetPassword =
    typeof authMustReset === 'boolean' ? authMustReset : Boolean(profile?.must_reset_password);

  if (initializing || tenantLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles?.length && profile?.role && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (mustResetPassword && !allowPasswordReset) {
    return <Navigate to="/first-login-reset" replace />;
  }

  if (!mustResetPassword && allowPasswordReset) {
    return <Navigate to="/dashboard" replace />;
  }

  const needsDomainVerification =
    tenant && profile?.tenant_id && !workspaceCanAccessApp(tenant);

  if (needsDomainVerification && !allowDomainVerification) {
    return <Navigate to="/verify-domain" replace state={{ from: location.pathname }} />;
  }

  if (allowDomainVerification && workspaceCanAccessApp(tenant)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
