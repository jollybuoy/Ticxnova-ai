import { CreditCard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PlanBadge } from '../../components/billing/PlanBadge';
import { Button } from '../../components/ui/Button';
import { usePlanAccess } from '../../hooks/usePlanAccess';
import { useTenant } from '../../hooks/useTenant';
import { PLAN_LABELS, PLANS } from '../../lib/plans/planConfig';
import { requestPlanChange } from '../../lib/billing/stripeFoundation';

const planHighlights = {
  starter: ['Tickets & devices', 'Basic reports', 'AI summaries'],
  professional: ['Knowledge base', 'SMTP & invites', 'Microsoft login', 'Advanced reports'],
  enterprise: ['Multi-domain', 'Automation & SLA', 'Audit logs', 'Graph sync ready'],
};

export default function BillingSettings() {
  const { tenant, mutating } = useTenant();
  const { plan, planLabel, trial, isTrialExpiring } = usePlanAccess();

  const handleUpgrade = async (targetPlan) => {
    if (!tenant?.id) return;
    const result = await requestPlanChange(tenant.id, targetPlan);
    toast.message(result.message ?? 'Billing checkout coming soon');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">
              Subscription
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Billing & plans</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Your free trial is 7 days from the date your workspace was created. Upgrade anytime
              to keep access after it ends.
            </p>
          </div>
          <PlanBadge />
        </div>

        <div className="glass-card grid gap-4 p-6 md:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-500">Current plan</p>
            <p className="mt-1 text-lg font-semibold text-white">{planLabel}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Status</p>
            <p className="mt-1 text-lg font-semibold capitalize text-white">
              {tenant?.subscription_status ?? trial.status}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Trial (from account created)</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {trial.isExpired
                ? 'Expired'
                : `${trial.daysRemaining} day${trial.daysRemaining === 1 ? '' : 's'} left`}
            </p>
            {trial.startedAt && (
              <p className="mt-1 text-xs text-zinc-500">
                Started {new Date(trial.startedAt).toLocaleDateString()}
                {trial.endsAt ? ` · ends ${new Date(trial.endsAt).toLocaleDateString()}` : ''}
              </p>
            )}
          </div>
        </div>

        {isTrialExpiring && !trial.isExpired && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Your trial ends soon. Upgrade to avoid losing access to core modules.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((planKey) => {
            const isCurrent = plan === planKey;
            return (
              <div
                key={planKey}
                className={`glass-card flex flex-col p-6 ${
                  isCurrent ? 'ring-2 ring-violet-500/50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">{PLAN_LABELS[planKey]}</h2>
                  {isCurrent && (
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-200">
                      Current
                    </span>
                  )}
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-zinc-400">
                  {planHighlights[planKey].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Sparkles size={14} className="shrink-0 text-violet-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={isCurrent ? 'secondary' : 'primary'}
                  disabled={isCurrent || mutating}
                  onClick={() => handleUpgrade(planKey)}
                >
                  {isCurrent ? 'Current plan' : `Upgrade to ${PLAN_LABELS[planKey]}`}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="glass-card flex items-start gap-4 p-6">
          <CreditCard className="mt-0.5 text-violet-400" size={22} />
          <div>
            <h3 className="font-medium text-white">Stripe billing (foundation)</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Customer ID: {tenant?.stripe_customer_id ?? '—'} · Subscription:{' '}
              {tenant?.stripe_subscription_id ?? '—'}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Webhook-ready architecture is in place. Production Checkout will connect here without
              changing tenant isolation or plan gating.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
