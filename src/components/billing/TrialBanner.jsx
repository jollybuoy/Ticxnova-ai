import { Link } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';
import { usePlanAccess } from '../../hooks/usePlanAccess';

export function TrialBanner() {
  const { trial, planLabel, isTrialExpiring, isTrialExpired } = usePlanAccess();

  if (isTrialExpired) return null;

  if (trial.daysRemaining > 3) return null;

  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
        isTrialExpiring
          ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
          : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100'
      }`}
    >
      <div className="flex items-center gap-3 text-sm">
        <Clock size={18} />
        <span>
          <strong>{planLabel}</strong> — {trial.daysRemaining} day
          {trial.daysRemaining === 1 ? '' : 's'} left in your 7-day trial
          {trial.endsAt
            ? ` (ends ${new Date(trial.endsAt).toLocaleDateString()})`
            : ''}
        </span>
      </div>
      <Link
        to="/settings/billing"
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium hover:bg-white/15"
      >
        <Sparkles size={14} />
        Upgrade now
      </Link>
    </div>
  );
}
