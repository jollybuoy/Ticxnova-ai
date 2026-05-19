import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useSubscriptionAccess } from '../../hooks/useSubscriptionAccess';
import { UpgradePrompt } from './UpgradePrompt';

/**
 * Gates write actions by trial read-only, plan feature, and RBAC action rules.
 */
export function WriteGuard({
  module,
  action = 'create',
  feature,
  children,
  fallback,
  compact = false,
}) {
  const { canWrite, canPerformAction, isReadOnly, canUseFeature } = useSubscriptionAccess();

  if (feature && !canUseFeature(feature)) {
    if (fallback) return fallback;
    return <UpgradePrompt feature={feature} compact={compact} />;
  }

  if (isReadOnly) {
    if (fallback) return fallback;
    return (
      <div
        className={`rounded-2xl border border-red-400/20 bg-red-500/5 px-4 py-3 text-sm text-red-100/90 ${
          compact ? 'py-2' : ''
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <Lock size={16} />
            Trial expired — upgrade to unlock this action.
          </span>
          <Link to="/settings/billing" className="text-xs font-medium text-violet-300 hover:text-violet-200">
            View plans
          </Link>
        </div>
      </div>
    );
  }

  if (!canPerformAction(module, action) || !canWrite(module, action)) {
    if (fallback) return fallback;
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
        You do not have permission to perform this action.
      </div>
    );
  }

  return children;
}
