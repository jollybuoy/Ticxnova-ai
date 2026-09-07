export const STRIPE_TRIAL_DAYS = 7;

/** First checkout collects a card and starts a 7-day trial. Later checkouts charge immediately. */
export function shouldGrantCheckoutTrial(tenant) {
  return !tenant?.stripe_subscription_id;
}

/** Stripe Checkout finished and the workspace has a live (or trialing) subscription. */
export function isStripeCheckoutComplete(subscription) {
  if (!subscription?.stripe_subscription_id) return false;
  return subscription.status === 'active' || subscription.status === 'trialing';
}
