import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { PlanUpgradeCards } from '../components/billing/PlanUpgradeCards';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { useTenant } from '../hooks/useTenant';

export default function TrialExpired() {
  const { plan, planLabel, trial } = usePlanAccess();
  const { tenant } = useTenant();
  const { upgradingPlan, isBusy, startCheckout } = useStripeCheckout(tenant);

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-10 py-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-200">
            <Clock size={32} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
            Trial ended
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Subscribe to continue</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            Your {planLabel} workspace trial has ended
            {trial.endsAt ? ` on ${new Date(trial.endsAt).toLocaleDateString()}` : ''}. Choose a
            plan below — you&apos;ll be redirected to Stripe to complete payment (CAD, monthly).
          </p>
        </div>

        <PlanUpgradeCards
          currentPlan={plan}
          subscriptionStatus={tenant?.subscription_status}
          stripeSubscriptionId={tenant?.stripe_subscription_id}
          mutating={isBusy}
          upgradingPlan={upgradingPlan}
          onSelectPlan={(targetPlan) => void startCheckout(targetPlan, {
            urls: {
              successUrl: `${window.location.origin}/settings/billing?checkout=success`,
              cancelUrl: `${window.location.origin}/trial-expired?checkout=canceled`,
            },
          })}
        />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/settings/billing"
            className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-300 hover:bg-white/5"
          >
            Billing details
          </Link>
          <Link
            to="/profile"
            className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-300 hover:bg-white/5"
          >
            Account settings
          </Link>
        </div>
      </div>
    </>
  );
}
