import { useMemo } from 'react';
import { useTenant } from './useTenant';
import {
  canAccessApp,
  canUseFeature,
  getPlanAccessSummary,
  getUpgradePlanLabel,
} from '../lib/plans/planAccess';

export function usePlanAccess() {
  const { tenant } = useTenant();

  return useMemo(() => {
    const summary = getPlanAccessSummary(tenant);

    return {
      tenant,
      plan: summary.plan,
      planLabel: summary.planLabel,
      trial: summary.trial,
      canAccessApp: summary.canAccessApp,
      canUseFeature: (feature) => canUseFeature(tenant, feature),
      getUpgradePlanLabel,
      isTrialExpiring: summary.trial.daysRemaining <= 3 && !summary.trial.isExpired,
      isTrialExpired: summary.trial.isExpired,
      isReadOnly: summary.trial.isReadOnly,
    };
  }, [tenant]);
}

export function useCanAccessApp() {
  const { tenant } = useTenant();
  return useMemo(() => canAccessApp(tenant), [tenant]);
}
