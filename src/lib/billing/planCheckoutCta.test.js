import { describe, expect, it } from 'vitest';
import { planUpgradeBadge, planUpgradeButtonLabel } from './planCheckoutCta';

describe('plan checkout CTAs', () => {
  it('offers a 7-day trial only while the workspace trial is still available', () => {
    expect(
      planUpgradeButtonLabel({
        planKey: 'starter',
        currentPlan: 'enterprise',
        subscriptionStatus: 'trialing',
        stripeSubscriptionId: null,
        grantTrial: true,
      }),
    ).toBe('Start 7-day trial — Starter');
  });

  it('asks expired workspaces to subscribe instead of starting another trial', () => {
    expect(
      planUpgradeButtonLabel({
        planKey: 'enterprise',
        currentPlan: 'enterprise',
        subscriptionStatus: 'trialing',
        stripeSubscriptionId: null,
        grantTrial: false,
      }),
    ).toBe('Subscribe to Enterprise');
    expect(
      planUpgradeBadge({
        currentPlan: 'enterprise',
        planKey: 'enterprise',
        paidActive: false,
        grantTrial: false,
      }),
    ).toBeNull();
  });
});
