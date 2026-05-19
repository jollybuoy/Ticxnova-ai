import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlanAccess } from './usePlanAccess';
import { useTenant } from './useTenant';
import { canPerformAction as canRolePerformAction } from '../lib/rbac/actionPermissions';
import {
  canPerformWrite,
  isPathAllowedInReadOnly,
  isPathBlockedInReadOnly,
  isTrialExemptPath,
} from '../lib/plans/subscriptionEnforcement';

/**
 * Centralized subscription + trial + write enforcement for UI and guards.
 */
export function useSubscriptionAccess() {
  const location = useLocation();
  const { tenant, role } = useTenant();
  const planAccess = usePlanAccess();

  return useMemo(() => {
    const pathname = location.pathname;
    const { isReadOnly, isTrialExpired, isTrialExpiring, trial, canUseFeature } = planAccess;

    const canWrite = (module, action = 'create') => {
      if (isReadOnly) return false;
      return canPerformWrite(tenant, role, module, action);
    };

    return {
      ...planAccess,
      tenant,
      role,
      canUseFeature,
      canWrite,
      canPerformAction: (module, action) => {
        if (isReadOnly) return false;
        return canRolePerformAction(role, module, action);
      },
      isTrialExemptPath: isTrialExemptPath(pathname),
      isCurrentPathBlockedInReadOnly: isReadOnly && isPathBlockedInReadOnly(pathname),
      isCurrentPathAllowedInReadOnly: !isReadOnly || isPathAllowedInReadOnly(pathname),
      trialDaysRemaining: trial.daysRemaining,
      showTrialWarning: trial.status === 'trialing' && isTrialExpiring && !isTrialExpired,
      showReadOnlyBanner: isReadOnly,
    };
  }, [location.pathname, planAccess, role, tenant]);
}
