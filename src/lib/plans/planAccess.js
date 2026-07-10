import {
  FEATURE_MIN_PLAN,
  PLAN_FEATURES,
  PLAN_LABELS,
  PLANS,
} from './planConfig';
import {
  getTrialDaysRemaining,
  getTrialEndsAt,
  getTrialStartedAt,
} from './trialDates';

export function normalizePlan(plan) {
  const normalized = String(plan || 'starter').toLowerCase();
  return PLANS.includes(normalized) ? normalized : 'starter';
}

export function planIncludesFeature(plan, feature) {
  const normalized = normalizePlan(plan);
  return PLAN_FEATURES[normalized]?.has(feature) ?? false;
}

export function getMinimumPlanForFeature(feature) {
  return FEATURE_MIN_PLAN[feature] ?? 'enterprise';
}

export function getUpgradePlanLabel(feature) {
  const plan = getMinimumPlanForFeature(feature);
  return PLAN_LABELS[plan] ?? 'Professional';
}

export function getUpgradePlanKey(feature) {
  return getMinimumPlanForFeature(feature);
}

export function getTrialState(tenant) {
  if (!tenant) {
    return {
      status: 'unknown',
      isExpired: false,
      daysRemaining: 0,
      canUseApp: false,
      isReadOnly: false,
      startedAt: null,
      endsAt: null,
    };
  }

  const status = tenant.subscription_status ?? 'trialing';
  const startedAt = getTrialStartedAt(tenant);
  const endsAt = getTrialEndsAt(tenant);
  const daysRemaining = getTrialDaysRemaining(tenant);
  const now = Date.now();

  const isExpired =
    status === 'expired' ||
    status === 'suspended' ||
    (status === 'trialing' && endsAt && endsAt.getTime() < now);

  const isActivePaid = status === 'active';

  return {
    status,
    isExpired: isExpired && !isActivePaid,
    daysRemaining,
    canUseApp: !isExpired || isActivePaid,
    isReadOnly: isExpired && !isActivePaid,
    startedAt,
    endsAt,
  };
}

export function canAccessApp(tenant) {
  const trial = getTrialState(tenant);
  const domainOk =
    tenant?.domain_verified === true && tenant?.verification_status === 'verified';
  return domainOk && (trial.canUseApp || tenant?.subscription_status === 'active');
}

export function canUseFeature(tenant, feature) {
  if (!tenant || !feature) return false;
  const trial = getTrialState(tenant);
  if (trial.isReadOnly) return false;
  return planIncludesFeature(tenant.subscription_plan, feature);
}

export function getPlanAccessSummary(tenant) {
  const plan = normalizePlan(tenant?.subscription_plan);
  const trial = getTrialState(tenant);
  return {
    plan,
    planLabel: PLAN_LABELS[plan],
    trial,
    canAccessApp: canAccessApp(tenant),
  };
}
