import { Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { PLAN_LABELS, PLANS } from '../../lib/plans/planConfig';
import { formatPlanPrice } from '../../lib/plans/planPricing';

const planHighlights = {
  starter: ['Tickets & devices', 'Basic reports', 'AI summaries'],
  professional: ['Knowledge base', 'SMTP & invites', 'Enterprise SSO', 'Advanced reports'],
  enterprise: ['Multi-domain', 'Automation & SLA', 'Audit logs', 'Directory sync'],
};

function isPaidActive(subscriptionStatus, stripeSubscriptionId) {
  return subscriptionStatus === 'active' && Boolean(stripeSubscriptionId);
}

export function PlanUpgradeCards({
  currentPlan,
  subscriptionStatus = 'trialing',
  stripeSubscriptionId = null,
  mutating = false,
  upgradingPlan = null,
  onSelectPlan,
  compact = false,
}) {
  const paidActive = isPaidActive(subscriptionStatus, stripeSubscriptionId);

  return (
    <div className={`grid gap-6 ${compact ? 'md:grid-cols-3' : 'lg:grid-cols-3'}`}>
      {PLANS.map((planKey) => {
        const isCurrent = currentPlan === planKey;
        const isLoading = mutating && upgradingPlan === planKey;
        const isLockedCurrent = isCurrent && paidActive;
        const buttonLabel = isLockedCurrent
          ? 'Current plan'
          : paidActive
            ? `Change to ${PLAN_LABELS[planKey]}`
            : `Subscribe — ${PLAN_LABELS[planKey]}`;

        return (
          <div
            key={planKey}
            id={`plan-card-${planKey}`}
            className={`glass-card flex flex-col p-6 ${
              isCurrent ? 'ring-2 ring-violet-500/50' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">{PLAN_LABELS[planKey]}</h2>
                <p className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-white">
                    {formatPlanPrice(planKey)}
                  </span>
                  <span className="text-sm text-zinc-500">CAD / mo</span>
                </p>
              </div>
              {isCurrent && (
                <span className="shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-200">
                  {paidActive ? 'Current' : 'Trial'}
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
              variant={isLockedCurrent ? 'secondary' : 'primary'}
              disabled={isLockedCurrent || mutating}
              loading={isLoading}
              onClick={() => onSelectPlan(planKey)}
            >
              {buttonLabel}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
