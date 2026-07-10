import { PLANS } from '../plans/planConfig';

/**
 * Build in-app billing URL. Pass `checkout` to auto-start Stripe Checkout on load.
 */
export function billingPath({ plan, checkout = false } = {}) {
  const normalized = plan ? String(plan).toLowerCase() : '';
  const params = new URLSearchParams();
  if (normalized && PLANS.includes(normalized)) {
    params.set(checkout ? 'checkout' : 'plan', normalized);
  }
  const query = params.toString();
  return query ? `/settings/billing?${query}` : '/settings/billing';
}
