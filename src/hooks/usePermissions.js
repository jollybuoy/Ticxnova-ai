import { useMemo } from 'react';
import { usePlanAccess } from './usePlanAccess';
import { useTenant } from './useTenant';
import { canAccessModule, canManageModule, MODULES } from '../lib/rbac/modulePermissions';

export function usePermissions() {
  const { role } = useTenant();
  const planAccess = usePlanAccess();

  return useMemo(
    () => ({
      role,
      modules: MODULES,
      canAccessModule: (module, required) => canAccessModule(role, module, required),
      canManageModule: (module) => canManageModule(role, module),
      canUseFeature: planAccess.canUseFeature,
      plan: planAccess.plan,
      planLabel: planAccess.planLabel,
    }),
    [role, planAccess],
  );
}
