import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  assertBillingAdmin,
  corsHeaders,
  ensureStripeCustomer,
  getPriceIdForPlan,
  getStripeClient,
  jsonResponse,
} from '../_shared/stripeBilling.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const auth = await assertBillingAdmin(req);
    if ('error' in auth) return auth.error;

    const { user, profile, tenant, adminClient } = auth;
    const payload = await req.json().catch(() => ({}));
    const targetPlan = String(payload.targetPlan ?? payload.plan ?? '').toLowerCase();

    if (!['starter', 'professional', 'enterprise'].includes(targetPlan)) {
      return jsonResponse({ error: 'Invalid plan. Choose starter, professional, or enterprise.' }, 400);
    }

    const priceId = getPriceIdForPlan(targetPlan);
    if (!priceId) {
      return jsonResponse({
        error: `Stripe price not configured for "${targetPlan}". Set STRIPE_${targetPlan.toUpperCase()}_PRICE_ID.`,
      }, 400);
    }

    if (
      tenant.subscription_status === 'active' &&
      tenant.stripe_subscription_id &&
      tenant.subscription_plan === targetPlan
    ) {
      return jsonResponse({
        error: 'You are already subscribed to this plan.',
        code: 'ALREADY_SUBSCRIBED',
      }, 400);
    }

    if (tenant.subscription_status === 'active' && tenant.stripe_subscription_id) {
      return jsonResponse({
        error: 'Use the billing portal to change an active subscription.',
        code: 'USE_PORTAL',
      }, 400);
    }

    const stripe = getStripeClient();
    const customerId = await ensureStripeCustomer(stripe, adminClient, tenant, profile, user);

    const origin = req.headers.get('origin') ?? '';
    const successUrl = String(
      payload.successUrl ?? `${origin}/settings/billing?checkout=success`,
    );
    const cancelUrl = String(
      payload.cancelUrl ?? `${origin}/settings/billing?checkout=canceled`,
    );

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: tenant.id,
      metadata: {
        tenant_id: tenant.id,
        target_plan: targetPlan,
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          tenant_id: tenant.id,
          target_plan: targetPlan,
        },
      },
    });

    return jsonResponse({ url: session.url, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return jsonResponse({ error: message }, 500);
  }
});
