import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { usePlanAccess } from '../../hooks/usePlanAccess';
import { ROUTE_FEATURES } from '../../lib/plans/planConfig';
import { ROUTE_GUARDS, canAccessModule } from '../../lib/rbac/modulePermissions';
import {
  isPathAllowedInReadOnly,
  isPathBlockedInReadOnly,
  isTrialExemptPath,
} from '../../lib/plans/subscriptionEnforcement';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { UpgradePrompt } from '../billing/UpgradePrompt';

export function ProtectedRoute({
  children,
  allowPasswordReset = false,
  allowDomainVerification = false,
  allowTrialExpired = false,
  allowedRoles,
  requiredFeature,
}) {
  const { initializing, isAuthenticated, user } = useAuth();
  const { profile, tenant, role } = useTenant();
  const { canUseFeature, isReadOnly } = usePlanAccess();
  const location = useLocation();
  const authMustReset = user?.user_metadata?.must_reset_password;
  const mustResetPassword =
    typeof authMustReset === 'boolean' ? authMustReset : Boolean(profile?.must_reset_password);

  const routeFeature = requiredFeature ?? ROUTE_FEATURES[location.pathname];
  const routeGuard = ROUTE_GUARDS[location.pathname];
  const effectiveAllowTrialExpired =
    allowTrialExpired || isTrialExemptPath(location.pathname);

  if (initializing) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles?.length && profile?.role && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (routeGuard?.roles?.length && profile?.role && !routeGuard.roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (routeGuard?.module && !canAccessModule(role, routeGuard.module, 'read')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (mustResetPassword && !allowPasswordReset) {
    return <Navigate to="/first-login-reset" replace />;
  }

  if (!mustResetPassword && allowPasswordReset) {
    return <Navigate to="/dashboard" replace />;
  }

  const domainVerified =
    Boolean(tenant?.domain_verified) && tenant?.verification_status === 'verified';

  if (tenant && profile?.tenant_id && !domainVerified && !allowDomainVerification) {
    return <Navigate to="/verify-domain" replace state={{ from: location.pathname }} />;
  }

  if (allowDomainVerification && domainVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  // Read-only (expired trial): allow viewing core routes; block write-heavy modules
  if (domainVerified && isReadOnly && !effectiveAllowTrialExpired) {
    if (isPathBlockedInReadOnly(location.pathname)) {
      return <Navigate to="/trial-expired" replace state={{ from: location.pathname }} />;
    }
    if (!isPathAllowedInReadOnly(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const featureToCheck = routeGuard?.feature ?? routeFeature;
  if (featureToCheck && !canUseFeature(featureToCheck)) {
    return (
      <div className="mesh-dashboard flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <UpgradePrompt feature={featureToCheck} />
        </div>
      </div>
    );
  }

  return children;
}
