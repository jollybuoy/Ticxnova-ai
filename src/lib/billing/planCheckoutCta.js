import { PLAN_LABELS } from '../plans/planConfig';

export function isPaidActiveSubscription(subscriptionStatus, stripeSubscriptionId) {
  return Boolean(stripeSubscriptionId) && ['active', 'trialing'].includes(subscriptionStatus);
}

export function planUpgradeButtonLabel({
  planKey,
  currentPlan,
  subscriptionStatus,
  stripeSubscriptionId,
  grantTrial,
}) {
  const paidActive = isPaidActiveSubscription(subscriptionStatus, stripeSubscriptionId);
  if (currentPlan === planKey && paidActive) return 'Current plan';
  if (paidActive) return `Change to ${PLAN_LABELS[planKey]}`;
  if (grantTrial) return `Start 7-day trial — ${PLAN_LABELS[planKey]}`;
  return `Subscribe to ${PLAN_LABELS[planKey]}`;
}

export function planUpgradeBadge({ currentPlan, planKey, paidActive, grantTrial }) {
  if (currentPlan !== planKey) return null;
  if (paidActive) return 'Current';
  if (grantTrial) return 'Trial';
  return null;
}
