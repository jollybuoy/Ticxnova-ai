import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { usePlanAccess } from '../../hooks/usePlanAccess';
import { useStripeCheckout } from '../../hooks/useStripeCheckout';
import { useTenant } from '../../hooks/useTenant';
import { shouldGrantCheckoutTrial } from '../../lib/billing/checkoutTrial';
import { checkoutSuccessUrl } from '../../lib/billing/stripeFoundation';
import { PlanUpgradeCards } from './PlanUpgradeCards';

const UpgradePlansContext = createContext(null);

export function UpgradePlansProvider({ children }) {
  const [open, setOpen] = useState(false);
  const { tenant } = useTenant();
  const { plan, planLabel, trial } = usePlanAccess();
  const { upgradingPlan, isBusy, startCheckout } = useStripeCheckout(tenant);
  const grantTrial = Boolean(tenant) && shouldGrantCheckoutTrial(tenant);

  const openPlans = useCallback(() => setOpen(true), []);
  const closePlans = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openPlans, closePlans, isOpen: open }),
    [closePlans, open, openPlans],
  );

  const endedOn = trial.endsAt ? new Date(trial.endsAt).toLocaleDateString() : null;

  return (
    <UpgradePlansContext.Provider value={value}>
      {children}
      <Modal
        open={open}
        onClose={closePlans}
        size="5xl"
        title={grantTrial ? 'Start your 7-day trial' : 'Upgrade to restore access'}
        description={
          grantTrial
            ? 'Choose a plan, add a card, and you will not be charged until the trial ends.'
            : `Your ${planLabel} trial has ended${endedOn ? ` (${endedOn})` : ''}. Choose a plan to subscribe — your card will be charged today.`
        }
      >
        <PlanUpgradeCards
          compact
          currentPlan={plan}
          subscriptionStatus={tenant?.subscription_status}
          stripeSubscriptionId={tenant?.stripe_subscription_id}
          grantTrial={grantTrial}
          mutating={isBusy}
          upgradingPlan={upgradingPlan}
          onSelectPlan={(targetPlan) =>
            void startCheckout(targetPlan, {
              urls: {
                successUrl: checkoutSuccessUrl(),
                cancelUrl: `${window.location.origin}${window.location.pathname}`,
              },
            })
          }
        />
      </Modal>
    </UpgradePlansContext.Provider>
  );
}

export function useUpgradePlans() {
  const ctx = useContext(UpgradePlansContext);
  if (!ctx) {
    return {
      openPlans: () => {
        window.location.assign('/settings/billing');
      },
      closePlans: () => {},
      isOpen: false,
    };
  }
  return ctx;
}
