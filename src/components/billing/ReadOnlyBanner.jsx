import { Lock, Sparkles } from 'lucide-react';
import { useSubscriptionAccess } from '../../hooks/useSubscriptionAccess';
import { useUpgradePlans } from './UpgradePlansModal';

export function ReadOnlyBanner() {
  const { showReadOnlyBanner, planLabel } = useSubscriptionAccess();
  const { openPlans } = useUpgradePlans();

  if (!showReadOnlyBanner) return null;

  return (
    <div
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-red-100"
      role="status"
    >
      <div className="flex items-center gap-3 text-sm">
        <Lock size={18} className="shrink-0" />
        <span>
          Your <strong>{planLabel}</strong> trial has ended. This workspace is in{' '}
          <strong>read-only mode</strong> — you can view data and manage billing, but cannot create
          or update tickets, devices, KB articles, or use the AI assistant.
        </span>
      </div>
      <button
        type="button"
        onClick={openPlans}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium hover:bg-white/15"
      >
        <Sparkles size={14} />
        Upgrade to restore access
      </button>
    </div>
  );
}
