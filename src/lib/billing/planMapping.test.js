import { describe, expect, it } from 'vitest';
import { resolveStripePriceIds, STRIPE_PRICE_IDS_LIVE, STRIPE_PRICE_IDS_TEST } from './planMapping';
import { checkoutSuccessUrl, isPaidActiveStatus } from './checkoutUrls';

describe('resolveStripePriceIds', () => {
  it('uses live price IDs for production builds when env is unset', () => {
    const ids = resolveStripePriceIds({}, { isProd: true });
    expect(ids).toEqual(STRIPE_PRICE_IDS_LIVE);
  });

  it('uses test price IDs outside production when env is unset', () => {
    const ids = resolveStripePriceIds({}, { isProd: false });
    expect(ids).toEqual(STRIPE_PRICE_IDS_TEST);
  });

  it('lets Netlify env override the fallback catalog', () => {
    const ids = resolveStripePriceIds(
      { VITE_STRIPE_STARTER_PRICE_ID: 'price_custom_starter' },
      { isProd: true },
    );
    expect(ids.starter).toBe('price_custom_starter');
    expect(ids.professional).toBe(STRIPE_PRICE_IDS_LIVE.professional);
  });
});

describe('checkout unlock helpers', () => {
  it('includes the Stripe session placeholder on the success URL', () => {
    expect(checkoutSuccessUrl('https://ticxnova.com')).toContain(
      'session_id={CHECKOUT_SESSION_ID}',
    );
  });

  it('treats only active as paid-unlocked', () => {
    expect(isPaidActiveStatus('active')).toBe(true);
    expect(isPaidActiveStatus('trialing')).toBe(false);
    expect(isPaidActiveStatus('past_due')).toBe(false);
  });
});
