import { describe, expect, it } from 'vitest';
import { isStripeCheckoutComplete, shouldGrantCheckoutTrial } from './checkoutTrial';

describe('checkout trial', () => {
  it('grants a 7-day trial only when there is no Stripe subscription yet', () => {
    expect(shouldGrantCheckoutTrial({})).toBe(true);
    expect(shouldGrantCheckoutTrial({ stripe_subscription_id: null })).toBe(true);
    expect(shouldGrantCheckoutTrial({ stripe_subscription_id: 'sub_123' })).toBe(false);
  });

  it('does not grant another trial after the workspace free trial has ended', () => {
    expect(
      shouldGrantCheckoutTrial({
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      }),
    ).toBe(false);
    expect(
      shouldGrantCheckoutTrial({
        subscription_status: 'expired',
        stripe_subscription_id: null,
      }),
    ).toBe(false);
  });

  it('treats a Stripe trial as checkout-complete so the workspace unlocks without charging', () => {
    expect(isStripeCheckoutComplete({ stripe_subscription_id: 'sub_123', status: 'trialing' })).toBe(true);
    expect(isStripeCheckoutComplete({ stripe_subscription_id: 'sub_123', status: 'active' })).toBe(true);
    expect(isStripeCheckoutComplete({ status: 'trialing' })).toBe(false);
    expect(isStripeCheckoutComplete({ stripe_subscription_id: 'sub_123', status: 'canceled' })).toBe(false);
  });
});
