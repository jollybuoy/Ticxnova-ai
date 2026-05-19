import { useMemo } from 'react';
import { usePlanAccess } from './usePlanAccess';
import { useTenant } from './useTenant';
import {
  canAccessModule,
  canManageModule,
  MODULES,
} from '../lib/rbac/modulePermissions';
import { canPerformAction, getActionDenialReason } from '../lib/rbac/actionPermissions';

export function usePermissions() {
  const { role } = useTenant();
  const planAccess = usePlanAccess();

  return useMemo(
    () => ({
      role,
      modules: MODULES,
      canAccessModule: (module, required) => canAccessModule(role, module, required),
      canManageModule: (module) => canManageModule(role, module),
      canPerformAction: (module, action) => canPerformAction(role, module, action),
      getActionDenialReason: (module, action) => getActionDenialReason(role, module, action),
      canUseFeature: planAccess.canUseFeature,
      plan: planAccess.plan,
      planLabel: planAccess.planLabel,
    }),
    [role, planAccess],
  );
}
