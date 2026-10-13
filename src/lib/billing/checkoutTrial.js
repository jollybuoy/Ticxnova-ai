import { getTrialState } from '../plans/planAccess';

export const STRIPE_TRIAL_DAYS = 7;

/** First checkout collects a card and starts a 7-day trial. Expired workspaces pay immediately. */
export function shouldGrantCheckoutTrial(tenant) {
  if (tenant?.stripe_subscription_id) return false;
  const trial = getTrialState(tenant);
  if (trial.isExpired || trial.isReadOnly) return false;
  return true;
}

/** Stripe Checkout finished and the workspace has a live (or trialing) subscription. */
export function isStripeCheckoutComplete(subscription) {
  if (!subscription?.stripe_subscription_id) return false;
  return subscription.status === 'active' || subscription.status === 'trialing';
}
