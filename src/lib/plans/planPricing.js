/** Display + billing prices (CAD, monthly). Stripe Price IDs come from env. */
export const PLAN_CURRENCY = 'CAD';

export const PLAN_PRICES_CAD = {
  starter: 149,
  professional: 499,
  enterprise: 999,
};

export function formatPlanPrice(planKey, { currency = PLAN_CURRENCY } = {}) {
  const amount = PLAN_PRICES_CAD[planKey];
  if (!amount) return 'Contact us';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPlanPriceLabel(planKey) {
  const formatted = formatPlanPrice(planKey);
  return formatted === 'Contact us' ? formatted : `${formatted} / month`;
}
