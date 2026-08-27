import { describe, expect, it } from 'vitest';
import { canAccessApp, canUseFeature, getTrialState } from './planAccess';
import { FEATURES } from './planConfig';

const DAY = 24 * 60 * 60 * 1000;

function tenant(overrides = {}) {
  const created = new Date(Date.now() - 2 * DAY).toISOString();
  return {
    created_at: created,
    domain_verified: true,
    verification_status: 'verified',
    subscription_status: 'trialing',
    subscription_plan: 'starter',
    ...overrides,
  };
}

describe('getTrialState', () => {
  it('keeps a paid workspace unlocked even after trial dates expire', () => {
    const state = getTrialState(
      tenant({
        subscription_status: 'active',
        trial_ends_at: new Date(Date.now() - DAY).toISOString(),
      }),
    );
    expect(state.isReadOnly).toBe(false);
    expect(state.canUseApp).toBe(true);
    expect(state.isExpired).toBe(false);
  });

  it('locks an expired trial until payment succeeds', () => {
    const state = getTrialState(
      tenant({
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() - DAY).toISOString(),
      }),
    );
    expect(state.isReadOnly).toBe(true);
    expect(state.canUseApp).toBe(false);
  });
});

describe('canUseFeature after payment', () => {
  it('unlocks professional features when the tenant plan is professional and active', () => {
    const paid = tenant({
      subscription_status: 'active',
      subscription_plan: 'professional',
    });
    expect(canUseFeature(paid, FEATURES.KNOWLEDGE_BASE)).toBe(true);
    expect(canUseFeature(paid, FEATURES.INVITE_USERS)).toBe(true);
    expect(canUseFeature(paid, FEATURES.AUDIT_LOGS)).toBe(false);
  });

  it('does not unlock features while the workspace is read-only', () => {
    const expired = tenant({
      subscription_status: 'expired',
      subscription_plan: 'enterprise',
    });
    expect(canUseFeature(expired, FEATURES.TICKETS)).toBe(false);
    expect(canAccessApp(expired)).toBe(false);
  });

  it('still requires a verified domain after payment', () => {
    const unpaidDomain = tenant({
      subscription_status: 'active',
      subscription_plan: 'professional',
      domain_verified: false,
      verification_status: 'pending',
    });
    expect(canAccessApp(unpaidDomain)).toBe(false);
  });
});
