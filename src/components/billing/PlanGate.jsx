import { usePlanAccess } from '../../hooks/usePlanAccess';
import { UpgradePrompt } from './UpgradePrompt';

export function PlanGate({
  feature,
  children,
  fallback,
  compact = false,
  title,
  description,
}) {
  const { canUseFeature } = usePlanAccess();

  if (canUseFeature(feature)) {
    return children;
  }

  if (fallback) return fallback;

  return (
    <UpgradePrompt
      feature={feature}
      compact={compact}
      title={title}
      description={description}
    />
  );
}

export function PlanLockedOverlay({ feature, children, className = '' }) {
  const { canUseFeature } = usePlanAccess();
  if (canUseFeature(feature)) return children;

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none select-none blur-[2px] opacity-50">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <UpgradePrompt feature={feature} compact />
      </div>
    </div>
  );
}
