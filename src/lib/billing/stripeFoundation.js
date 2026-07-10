import { supabase } from '../supabase';
import {
  isStripeConfigured,
  mapStripePriceToPlan,
  PLAN_TO_STRIPE_PRICE,
  STRIPE_PRICE_IDS,
} from './planMapping';

export {
  isStripeConfigured,
  mapStripePriceToPlan,
  PLAN_TO_STRIPE_PRICE,
  STRIPE_PRICE_IDS,
};

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

/**
 * Start Stripe Checkout — redirects browser on success.
 */
export async function requestPlanChange(tenantId, targetPlan, urls = {}) {
  const priceId = PLAN_TO_STRIPE_PRICE[targetPlan];
  if (!priceId) {
    return {
      success: false,
      message:
        'Stripe price IDs are not configured. Add VITE_STRIPE_*_PRICE_ID to your .env file.',
    };
  }

  const origin = window.location.origin;
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      tenantId,
      targetPlan,
      plan: targetPlan,
      successUrl: urls.successUrl ?? `${origin}/settings/billing?checkout=success`,
      cancelUrl: urls.cancelUrl ?? `${origin}/settings/billing?checkout=canceled`,
    },
  });

  if (error) {
    return {
      success: false,
      message: error.message || 'Could not start checkout. Try again or contact support.',
    };
  }

  if (data?.error) {
    return {
      success: false,
      message: data.error,
      code: data.code ?? null,
    };
  }

  if (data?.url) {
    return { success: true, url: data.url };
  }

  return { success: false, message: 'Checkout session could not be created.' };
}

/**
 * Open Stripe Customer Portal for invoices, payment method, cancellation.
 */
export async function openBillingPortal(tenantId) {
  const origin = window.location.origin;
  const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
    body: {
      tenantId,
      returnUrl: `${origin}/settings/billing`,
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }
  if (data?.error) {
    return { success: false, message: data.error };
  }
  if (data?.url) {
    return { success: true, url: data.url };
  }
  return { success: false, message: 'Billing portal unavailable.' };
}
