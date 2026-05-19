import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { getUpgradePlanLabel } from '../../lib/plans/planAccess';
import { PLAN_LABELS } from '../../lib/plans/planConfig';

export function UpgradePrompt({
  feature,
  title = 'Upgrade required',
  description,
  compact = false,
  className = '',
}) {
  const minPlan = feature ? getUpgradePlanLabel(feature) : 'Professional';
  const planLabel = PLAN_LABELS[minPlan.toLowerCase()] ?? minPlan;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs text-violet-100 ${className}`}
      >
        <Lock size={12} />
        {planLabel} plan
      </span>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
          <Lock size={20} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">
            Premium feature
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-zinc-400">
            {description ||
              `This capability is available on the ${planLabel} plan and above.`}
          </p>
          <Link
            to="/settings/billing"
            className="mt-4 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            View plans & upgrade →
          </Link>
        </div>
      </div>
    </div>
  );
}
