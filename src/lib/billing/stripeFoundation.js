import { supabase } from '../supabase';

/** Placeholder price IDs — replace when Stripe products are created */
export const STRIPE_PRICE_IDS = {
  starter: import.meta.env.VITE_STRIPE_PRICE_STARTER ?? 'price_starter_placeholder',
  professional: import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL ?? 'price_professional_placeholder',
  enterprise: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE ?? 'price_enterprise_placeholder',
};

export const PLAN_TO_STRIPE_PRICE = {
  starter: STRIPE_PRICE_IDS.starter,
  professional: STRIPE_PRICE_IDS.professional,
  enterprise: STRIPE_PRICE_IDS.enterprise,
};

export function mapStripePriceToPlan(priceId) {
  const entry = Object.entries(PLAN_TO_STRIPE_PRICE).find(([, id]) => id === priceId);
  return entry?.[0] ?? 'starter';
}

/**
 * Client-side subscription update hook structure.
 * Production checkout will call an edge function; this updates local tenant state after webhook.
 */
export async function applySubscriptionUpdate(tenantId, {
  subscription_plan,
  subscription_status = 'active',
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
}) {
  const { data, error } = await supabase
    .from('tenants')
    .update({
      subscription_plan,
      subscription_status,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_price_id,
    })
    .eq('id', tenantId)
    .select()
    .single();

  return { data, error };
}

export async function recordBillingEvent({ tenantId, stripeEventId, eventType, payload }) {
  const { data, error } = await supabase.from('billing_events').insert({
    tenant_id: tenantId,
    stripe_event_id: stripeEventId,
    event_type: eventType,
    payload,
    processed_at: new Date().toISOString(),
  });

  return { data, error };
}

export async function fetchTenantSubscriptionState(tenantId) {
  const { data, error } = await supabase.rpc('get_tenant_subscription_state', {
    target_tenant_id: tenantId,
  });
  return { data, error };
}

/** Upgrade / downgrade flow stubs for future Stripe Checkout session */
export async function requestPlanChange(_tenantId, _targetPlan) {
  return {
    success: false,
    message: 'Stripe Checkout is not enabled yet. Contact support to upgrade your workspace.',
  };
}
