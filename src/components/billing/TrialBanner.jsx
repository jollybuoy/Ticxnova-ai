import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { billingPath } from '../../lib/billing/billingPaths';
import { usePlanAccess } from '../../hooks/usePlanAccess';
import { useSubscriptionAccess } from '../../hooks/useSubscriptionAccess';
import { useTenant } from '../../hooks/useTenant';

export function TrialBanner() {
  const { tenant, loading: tenantLoading } = useTenant();
  const { trial, planLabel, isTrialExpired } = usePlanAccess();
  const { showReadOnlyBanner, showTrialWarning } = useSubscriptionAccess();

  if (tenantLoading || !tenant || showReadOnlyBanner) return null;
  if (tenant.subscription_status !== 'trialing') return null;
  if (isTrialExpired) return null;

  const isUrgent = showTrialWarning || trial.daysRemaining <= 3;

  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
        isUrgent
          ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
          : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100'
      }`}
    >
      <div className="flex items-center gap-3 text-sm">
        {isUrgent ? <AlertTriangle size={18} /> : <Clock size={18} />}
        <span>
          <strong>{planLabel}</strong> — {trial.daysRemaining} day
          {trial.daysRemaining === 1 ? '' : 's'} left in your 7-day trial
          {trial.endsAt ? ` (ends ${new Date(trial.endsAt).toLocaleDateString()})` : ''}
          {isUrgent && ' · Upgrade soon to avoid read-only mode'}
        </span>
      </div>
      <Link
        to={billingPath({ checkout: true })}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium hover:bg-white/15"
      >
        <Sparkles size={14} />
        Upgrade now
      </Link>
    </div>
  );
}
