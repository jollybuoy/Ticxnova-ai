import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PLAN_PRICE_ENV: Record<string, string[]> = {
  starter: ['STRIPE_STARTER_PRICE_ID', 'STRIPE_PRICE_STARTER'],
  professional: ['STRIPE_PROFESSIONAL_PRICE_ID', 'STRIPE_PRICE_PROFESSIONAL'],
  enterprise: ['STRIPE_ENTERPRISE_PRICE_ID', 'STRIPE_PRICE_ENTERPRISE'],
};

/** Test-mode Price IDs (CAD/month). Used with sk_test / rk_test. */
const PLAN_PRICE_FALLBACK_TEST: Record<string, string> = {
  starter: 'price_1TrSG9H1xnYBWgiR8Jrks4o6',
  professional: 'price_1TrSGAH1xnYBWgiRiENaDWTk',
  enterprise: 'price_1TrSGAH1xnYBWgiRkChP3iJc',
};

/** Live-mode Price IDs (CAD/month). Used with sk_live / rk_live. */
const PLAN_PRICE_FALLBACK_LIVE: Record<string, string> = {
  starter: 'price_1TezkkH1xnYBWgiRHnzscJTe',
  professional: 'price_1TezsyH1xnYBWgiRWJdPkNSn',
  enterprise: 'price_1TezwAH1xnYBWgiRaK6gLtRa',
};

export function isLiveStripeKey(secret = Deno.env.get('STRIPE_SECRET_KEY') ?? '') {
  return secret.startsWith('sk_live') || secret.startsWith('rk_live');
}

function priceFallbacks() {
  return isLiveStripeKey() ? PLAN_PRICE_FALLBACK_LIVE : PLAN_PRICE_FALLBACK_TEST;
}

export function withCheckoutSessionId(url: string) {
  if (!url || url.includes('{CHECKOUT_SESSION_ID}')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`;
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function getStripeClient() {
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecret) throw new Error('STRIPE_SECRET_KEY is not configured.');
  return new Stripe(stripeSecret, { apiVersion: '2024-11-20.acacia' });
}

export function getPriceIdForPlan(plan: string) {
  const normalized = plan.toLowerCase();
  const keys = PLAN_PRICE_ENV[normalized];
  if (!keys) return null;

  let fromEnv: string | undefined;
  for (const key of keys) {
    const value = Deno.env.get(key);
    if (value) {
      fromEnv = value;
      break;
    }
  }

  const fallbacks = priceFallbacks();
  if (fromEnv) {
    const live = isLiveStripeKey();
    const isTestPrice = Object.values(PLAN_PRICE_FALLBACK_TEST).includes(fromEnv);
    const isLivePrice = Object.values(PLAN_PRICE_FALLBACK_LIVE).includes(fromEnv);
    if (live && isTestPrice) return fallbacks[normalized] ?? fromEnv;
    if (!live && isLivePrice) return fallbacks[normalized] ?? fromEnv;
    return fromEnv;
  }

  return fallbacks[normalized] ?? null;
}

export function mapPriceToPlan(priceId: string | null | undefined) {
  if (!priceId) return 'starter';
  for (const [plan, keys] of Object.entries(PLAN_PRICE_ENV)) {
    for (const key of keys) {
      if (Deno.env.get(key) === priceId) return plan;
    }
    if (PLAN_PRICE_FALLBACK_TEST[plan] === priceId || PLAN_PRICE_FALLBACK_LIVE[plan] === priceId) {
      return plan;
    }
  }
  return 'starter';
}

export function mapStripeStatus(status: string) {
  if (status === 'active' || status === 'trialing') return status;
  if (status === 'past_due' || status === 'unpaid') return 'past_due';
  if (status === 'canceled') return 'canceled';
  if (status === 'incomplete' || status === 'incomplete_expired' || status === 'paused') {
    return 'expired';
  }
  return 'expired';
}

export async function assertBillingAdmin(
  req: Request,
): Promise<
  | { error: Response }
  | {
      user: { id: string; email?: string };
      profile: { id: string; tenant_id: string; role: string; email: string | null };
      tenant: {
        id: string;
        company_name: string | null;
        stripe_customer_id: string | null;
        billing_email: string | null;
      };
      adminClient: SupabaseClient;
    }
> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return { error: jsonResponse({ error: 'Missing Supabase environment variables.' }, 500) };
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) return { error: jsonResponse({ error: 'Unauthorized' }, 401) };

  const payload = await req.clone().json().catch(() => ({}));
  const tenantId = String(payload.tenantId ?? '');

  if (!tenantId) return { error: jsonResponse({ error: 'tenantId is required.' }, 400) };

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, tenant_id, role, email')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.tenant_id || profile.tenant_id !== tenantId) {
    return { error: jsonResponse({ error: 'You do not have access to this workspace.' }, 403) };
  }

  if (!['super_admin', 'org_admin'].includes(String(profile.role))) {
    return { error: jsonResponse({ error: 'Only workspace admins can manage billing.' }, 403) };
  }

  const { data: tenant, error: tenantError } = await adminClient
    .from('tenants')
    .select(
      'id, company_name, stripe_customer_id, billing_email, subscription_status, subscription_plan, stripe_subscription_id',
    )
    .eq('id', tenantId)
    .maybeSingle();

  if (tenantError || !tenant) {
    return { error: jsonResponse({ error: 'Workspace not found.' }, 404) };
  }

  return { user, profile, tenant, adminClient };
}

export async function ensureStripeCustomer(
  stripe: Stripe,
  adminClient: SupabaseClient,
  tenant: { id: string; company_name: string | null; stripe_customer_id: string | null; billing_email: string | null },
  profile: { email: string | null },
  user: { id: string; email?: string },
) {
  if (tenant.stripe_customer_id) return tenant.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: tenant.billing_email || profile.email || user.email || undefined,
    name: tenant.company_name ?? undefined,
    metadata: { tenant_id: tenant.id, supabase_user_id: user.id },
  });

  await adminClient
    .from('tenants')
    .update({
      stripe_customer_id: customer.id,
      billing_email: customer.email ?? profile.email,
    })
    .eq('id', tenant.id);

  return customer.id;
}

export function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  if (invoice.subscription) return String(invoice.subscription);
  const parent = invoice.parent as { subscription_details?: { subscription?: string } } | null;
  return parent?.subscription_details?.subscription ? String(parent.subscription_details.subscription) : null;
}

export async function syncFromCheckoutSession(
  stripe: Stripe,
  adminClient: SupabaseClient,
  session: Stripe.Checkout.Session,
  expectedTenantId?: string,
) {
  const tenantId = String(session.metadata?.tenant_id ?? session.client_reference_id ?? '');
  if (!tenantId) return { synced: false, reason: 'missing_tenant' as const };
  if (expectedTenantId && tenantId !== expectedTenantId) {
    return { synced: false, reason: 'tenant_mismatch' as const };
  }
  if (!session.subscription) {
    return { synced: false, reason: 'missing_subscription' as const, tenantId };
  }

  const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
  await syncSubscriptionRecord(adminClient, subscription, tenantId);

  if (session.customer) {
    await adminClient
      .from('tenants')
      .update({ stripe_customer_id: String(session.customer) })
      .eq('id', tenantId);
  }

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  return {
    synced: true as const,
    tenantId,
    status: mapStripeStatus(subscription.status),
    plan: subscription.metadata?.target_plan ?? mapPriceToPlan(priceId),
    subscriptionId: subscription.id,
  };
}

export async function syncSubscriptionRecord(
  adminClient: SupabaseClient,
  subscription: Stripe.Subscription,
  tenantIdOverride?: string | null,
) {
  const tenantId =
    tenantIdOverride ??
    subscription.metadata?.tenant_id ??
    subscription.metadata?.tenantId ??
    null;

  if (!tenantId) return;

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const plan = subscription.metadata?.target_plan ?? mapPriceToPlan(priceId);
  const status = mapStripeStatus(subscription.status);
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id ?? null;

  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;
  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  await adminClient.rpc('upsert_tenant_subscription_from_stripe', {
    p_tenant_id: tenantId,
    p_stripe_customer_id: customerId,
    p_stripe_subscription_id: subscription.id,
    p_stripe_price_id: priceId,
    p_plan: plan,
    p_status: status,
    p_trial_ends_at: trialEnd,
    p_current_period_start: periodStart,
    p_current_period_end: periodEnd,
    p_cancel_at_period_end: subscription.cancel_at_period_end ?? false,
  });
}
