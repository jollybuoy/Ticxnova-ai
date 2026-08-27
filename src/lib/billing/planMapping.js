import { PLAN_LABELS, PLANS } from '../plans/planConfig';
import { PLAN_PRICES_CAD } from '../plans/planPricing';

/** Test-mode public Price IDs (CAD / month). */
export const STRIPE_PRICE_IDS_TEST = {
  starter: 'price_1TrSG9H1xnYBWgiR8Jrks4o6',
  professional: 'price_1TrSGAH1xnYBWgiRiENaDWTk',
  enterprise: 'price_1TrSGAH1xnYBWgiRkChP3iJc',
};

/** Live-mode public Price IDs (CAD / month). */
export const STRIPE_PRICE_IDS_LIVE = {
  starter: 'price_1TezkkH1xnYBWgiRHnzscJTe',
  professional: 'price_1TezsyH1xnYBWgiRWJdPkNSn',
  enterprise: 'price_1TezwAH1xnYBWgiRaK6gLtRa',
};

export function resolveStripePriceIds(
  env = import.meta.env,
  { isProd = Boolean(env.PROD) } = {},
) {
  const fallback = isProd ? STRIPE_PRICE_IDS_LIVE : STRIPE_PRICE_IDS_TEST;
  return {
    starter:
      env.VITE_STRIPE_STARTER_PRICE_ID ||
      env.VITE_STRIPE_PRICE_STARTER ||
      fallback.starter,
    professional:
      env.VITE_STRIPE_PROFESSIONAL_PRICE_ID ||
      env.VITE_STRIPE_PRICE_PROFESSIONAL ||
      fallback.professional,
    enterprise:
      env.VITE_STRIPE_ENTERPRISE_PRICE_ID ||
      env.VITE_STRIPE_PRICE_ENTERPRISE ||
      fallback.enterprise,
  };
}

export const STRIPE_PRICE_IDS = resolveStripePriceIds();

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
  if (entry) return entry[0];
  const live = Object.entries(STRIPE_PRICE_IDS_LIVE).find(([, id]) => id === priceId);
  if (live) return live[0];
  const test = Object.entries(STRIPE_PRICE_IDS_TEST).find(([, id]) => id === priceId);
  return test?.[0] ?? 'starter';
}

export function isStripeConfigured() {
  return BILLING_PLANS.every((plan) => Boolean(STRIPE_PRICE_IDS[plan]));
}

export function getMissingStripePricePlans() {
  return BILLING_PLANS.filter((plan) => !STRIPE_PRICE_IDS[plan]);
}
