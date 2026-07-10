import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getMissingStripePricePlans, isStripeConfigured } from '../lib/billing/planMapping';
import {
  openBillingPortal,
  requestPlanChange,
} from '../lib/billing/stripeFoundation';
import { PLANS } from '../lib/plans/planConfig';

function isPaidActive(tenant) {
  return tenant?.subscription_status === 'active' && Boolean(tenant?.stripe_subscription_id);
}

export function useStripeCheckout(tenant) {
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const startCheckout = useCallback(
    async (targetPlan, options = {}) => {
      const plan = String(targetPlan ?? '').toLowerCase();
      if (!tenant?.id) {
        toast.error('Workspace not loaded. Refresh and try again.');
        return { success: false };
      }
      if (!PLANS.includes(plan)) {
        toast.error('Invalid plan selected.');
        return { success: false };
      }
      if (!isStripeConfigured()) {
        const missing = getMissingStripePricePlans().join(', ');
        toast.error(`Stripe price IDs missing for: ${missing}. See .env.example.`);
        return { success: false };
      }

      if (isPaidActive(tenant)) {
        if (tenant.subscription_plan === plan) {
          toast.message('You are already on this plan.');
          return { success: false };
        }
        if (!options.forceCheckout) {
          setPortalLoading(true);
          const portal = await openBillingPortal(tenant.id);
          setPortalLoading(false);
          if (portal.success && portal.url) {
            window.location.href = portal.url;
            return portal;
          }
          toast.error(portal.message ?? 'Open billing portal to change your plan.');
          return portal;
        }
      }

      setUpgradingPlan(plan);
      const result = await requestPlanChange(tenant.id, plan, options.urls);
      setUpgradingPlan(null);

      if (result.success && result.url) {
        window.location.href = result.url;
        return result;
      }

      if (result.code === 'USE_PORTAL') {
        setPortalLoading(true);
        const portal = await openBillingPortal(tenant.id);
        setPortalLoading(false);
        if (portal.success && portal.url) {
          window.location.href = portal.url;
          return portal;
        }
      }

      toast.error(result.message ?? 'Could not start checkout');
      return result;
    },
    [tenant],
  );

  return {
    upgradingPlan,
    portalLoading,
    isBusy: Boolean(upgradingPlan) || portalLoading,
    startCheckout,
    openPortal: async () => {
      if (!tenant?.id) return { success: false };
      setPortalLoading(true);
      const result = await openBillingPortal(tenant.id);
      setPortalLoading(false);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.message ?? 'Billing portal unavailable');
      }
      return result;
    },
  };
}
