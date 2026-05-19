import { usePlanAccess } from '../../hooks/usePlanAccess';

export function PlanBadge({ className = '' }) {
  const { planLabel, trial } = usePlanAccess();

  return (
    <span
      className={`inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 ${className}`}
    >
      {planLabel}
      {trial.status === 'trialing' && !trial.isExpired
        ? ` · ${trial.daysRemaining}d left (7d from signup)`
        : ''}
    </span>
  );
}
