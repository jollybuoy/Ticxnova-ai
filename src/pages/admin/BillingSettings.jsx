import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { PlanBadge } from '../../components/billing/PlanBadge';
import { PlanUpgradeCards } from '../../components/billing/PlanUpgradeCards';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { usePlanAccess } from '../../hooks/usePlanAccess';
import { useStripeCheckout } from '../../hooks/useStripeCheckout';
import { useTenant } from '../../hooks/useTenant';
import { getMissingStripePricePlans, isStripeConfigured } from '../../lib/billing/planMapping';
import { PLANS } from '../../lib/plans/planConfig';
import { fetchWorkspaceSubscription } from '../../lib/billing/subscriptionService';

export default function BillingSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tenant, mutating, refetch } = useTenant();
  const { plan, planLabel, trial, isTrialExpiring } = usePlanAccess();
  const { upgradingPlan, portalLoading, isBusy, startCheckout, openPortal } = useStripeCheckout(tenant);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const autoCheckoutStarted = useRef(false);

  const loadSubscription = async (tenantId) => {
    if (!tenantId) return;
    setSubscriptionLoading(true);
    const { data, error } = await fetchWorkspaceSubscription(tenantId);
    if (!error) setSubscription(data);
    setSubscriptionLoading(false);
  };

  useEffect(() => {
    if (tenant?.id) void loadSubscription(tenant.id);
  }, [tenant?.id]);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      toast.success('Payment received! Your subscription is activating…');
      void refetch();
      if (tenant?.id) void loadSubscription(tenant.id);
      setSearchParams({}, { replace: true });
      return;
    }
    if (checkout === 'canceled') {
      toast.message('Checkout canceled — no charges were made.');
      setSearchParams({}, { replace: true });
      return;
    }

    const planParam = searchParams.get('plan');
    if (planParam && PLANS.includes(planParam)) {
      document.getElementById(`plan-card-${planParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSearchParams({}, { replace: true });
    }
  }, [refetch, searchParams, setSearchParams, tenant?.id]);

  useEffect(() => {
    const targetPlan = searchParams.get('checkout');
    if (!targetPlan || !PLANS.includes(targetPlan)) return;
    if (!tenant?.id || autoCheckoutStarted.current || isBusy) return;
    if (!isStripeConfigured()) return;

    autoCheckoutStarted.current = true;
    void startCheckout(targetPlan);
  }, [isBusy, searchParams, startCheckout, tenant?.id]);

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : tenant?.subscription_expires_at
      ? new Date(tenant.subscription_expires_at).toLocaleDateString()
      : null;

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">
              Subscription
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Billing & plans</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Secure billing via Stripe. Click any plan to pay through Stripe Checkout (CAD, monthly).
              Supabase Auth remains your login — Stripe handles payments only.
            </p>
          </div>
          <PlanBadge />
        </div>

        {!isStripeConfigured() && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Stripe price IDs are not fully configured. Add VITE_STRIPE_STARTER_PRICE_ID,
            VITE_STRIPE_PROFESSIONAL_PRICE_ID, and VITE_STRIPE_ENTERPRISE_PRICE_ID to your .env, then
            set matching STRIPE_* secrets on Supabase edge functions. See .env.example.
            {getMissingStripePricePlans().length > 0 && (
              <span className="mt-1 block text-xs opacity-90">
                Missing: {getMissingStripePricePlans().join(', ')}
              </span>
            )}
          </div>
        )}

        <div className="glass-card grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500">Current plan</p>
            <p className="mt-1 text-lg font-semibold text-white">{planLabel}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Subscription status</p>
            <p className="mt-1 text-lg font-semibold capitalize text-white">
              {subscription?.status ?? tenant?.subscription_status ?? trial.status}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Trial remaining</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {trial.isExpired
                ? 'Expired'
                : `${trial.daysRemaining} day${trial.daysRemaining === 1 ? '' : 's'}`}
            </p>
            {trial.endsAt && (
              <p className="mt-1 text-xs text-zinc-500">
                Ends {new Date(trial.endsAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-zinc-500">Billing period</p>
            {subscriptionLoading ? (
              <Spinner className="mt-2 h-5 w-5 text-violet-400" />
            ) : (
              <>
                <p className="mt-1 text-lg font-semibold text-white">
                  {periodEnd ? `Renews ${periodEnd}` : '—'}
                </p>
                {subscription?.cancel_at_period_end && (
                  <p className="mt-1 text-xs text-amber-400">Cancels at period end</p>
                )}
              </>
            )}
          </div>
        </div>

        {isTrialExpiring && !trial.isExpired && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Your trial ends soon. Subscribe to avoid read-only mode.
          </div>
        )}

        {trial.isExpired && tenant?.subscription_status !== 'active' && (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            Your trial has ended. Choose a plan below to restore full access.
          </div>
        )}

        <PlanUpgradeCards
          currentPlan={plan}
          subscriptionStatus={tenant?.subscription_status}
          stripeSubscriptionId={tenant?.stripe_subscription_id ?? subscription?.stripe_subscription_id}
          mutating={mutating || isBusy}
          upgradingPlan={upgradingPlan}
          onSelectPlan={(targetPlan) => void startCheckout(targetPlan)}
        />

        <div className="glass-card flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <CreditCard className="mt-0.5 shrink-0 text-violet-400" size={22} />
            <div>
              <h3 className="font-medium text-white">Payment & invoices</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Stripe customer: {tenant?.stripe_customer_id ?? subscription?.stripe_customer_id ?? '—'}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Subscription: {subscription?.stripe_subscription_id ?? tenant?.stripe_subscription_id ?? '—'}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            loading={portalLoading}
            disabled={!tenant?.id}
            onClick={() => void openPortal()}
          >
            <ExternalLink size={16} className="mr-2" />
            Manage billing
          </Button>
        </div>
      </div>
    </>
  );
}
