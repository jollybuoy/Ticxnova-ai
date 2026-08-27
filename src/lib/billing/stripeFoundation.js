import { supabase } from '../supabase';
import { fetchWorkspaceSubscription } from './subscriptionService';
import {
  isStripeConfigured,
  mapStripePriceToPlan,
  PLAN_TO_STRIPE_PRICE,
  STRIPE_PRICE_IDS,
} from './planMapping';
import { checkoutSuccessUrl, isPaidActiveStatus } from './checkoutUrls';

export {
  isStripeConfigured,
  mapStripePriceToPlan,
  PLAN_TO_STRIPE_PRICE,
  STRIPE_PRICE_IDS,
  checkoutSuccessUrl,
  isPaidActiveStatus,
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
      successUrl: urls.successUrl ?? checkoutSuccessUrl(origin),
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

export async function confirmCheckoutSession(tenantId, sessionId) {
  if (!tenantId || !sessionId) {
    return { success: false, unlocked: false, message: 'Missing checkout session.' };
  }

  const { data, error } = await supabase.functions.invoke('confirm-checkout-session', {
    body: { tenantId, sessionId },
  });

  if (error) {
    return { success: false, unlocked: false, message: error.message };
  }
  if (data?.error) {
    return { success: false, unlocked: false, message: data.error };
  }

  return {
    success: true,
    unlocked: Boolean(data?.unlocked),
    status: data?.status ?? null,
    plan: data?.plan ?? null,
    subscriptionId: data?.subscriptionId ?? null,
  };
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Confirm the Checkout Session with Stripe, then poll until the tenant is active.
 */
export async function waitForPaidUnlock(tenantId, sessionId, { timeoutMs = 20000, intervalMs = 1500 } = {}) {
  if (sessionId) {
    const confirmed = await confirmCheckoutSession(tenantId, sessionId);
    if (confirmed.unlocked) return confirmed;
  }

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const { data } = await fetchWorkspaceSubscription(tenantId);
    if (isPaidActiveStatus(data?.status)) {
      return {
        success: true,
        unlocked: true,
        status: data.status,
        plan: data.plan ?? null,
        subscriptionId: data.stripe_subscription_id ?? null,
      };
    }
    await sleep(intervalMs);
  }

  return { success: true, unlocked: false, status: null, plan: null, subscriptionId: null };
}
