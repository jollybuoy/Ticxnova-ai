import { PLAN_LABELS, PLANS } from '../plans/planConfig';
import { PLAN_PRICES_CAD } from '../plans/planPricing';

/**
 * Stripe Price ID mapping (client-safe — public price IDs only).
 * Supports current and legacy env variable names, with Ticxnova plan fallbacks.
 */
const TICXNOVA_PRICE_FALLBACK = {
  starter: 'price_1TrSG9H1xnYBWgiR8Jrks4o6',
  professional: 'price_1TrSGAH1xnYBWgiRiENaDWTk',
  enterprise: 'price_1TrSGAH1xnYBWgiRkChP3iJc',
};

export const STRIPE_PRICE_IDS = {
  starter:
    import.meta.env.VITE_STRIPE_STARTER_PRICE_ID ??
    import.meta.env.VITE_STRIPE_PRICE_STARTER ??
    TICXNOVA_PRICE_FALLBACK.starter,
  professional:
    import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID ??
    import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL ??
    TICXNOVA_PRICE_FALLBACK.professional,
  enterprise:
    import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID ??
    import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE ??
    TICXNOVA_PRICE_FALLBACK.enterprise,
};

export const BILLING_PLANS = PLANS;

export const PLAN_CATALOG = BILLING_PLANS.map((key) => ({
  key,
  label: PLAN_LABELS[key],
  priceCad: PLAN_PRICES_CAD[key],
  stripePriceId: STRIPE_PRICE_IDS[key],
}));

export const PLAN_TO_STRIPE_PRICE = { ...STRIPE_PRICE_IDS };

export function mapStripePriceToPlan(priceId) {
  const entry = Object.entries(STRIPE_PRICE_IDS).find(([, id]) => id && id === priceId);
  return entry?.[0] ?? 'starter';
}

export function isStripeConfigured() {
  return BILLING_PLANS.every((plan) => Boolean(STRIPE_PRICE_IDS[plan]));
}

export function getMissingStripePricePlans() {
  return BILLING_PLANS.filter((plan) => !STRIPE_PRICE_IDS[plan]);
}
