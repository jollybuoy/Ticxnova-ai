import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno';
import {
  corsHeaders,
  getStripeClient,
  syncSubscriptionRecord,
} from '../_shared/stripeBilling.ts';

async function syncInvoiceSubscription(
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice,
) {
  if (!invoice.subscription) return;
  const subscription = await stripe.subscriptions.retrieve(String(invoice.subscription));
  await syncSubscriptionRecord(supabase, subscription);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.text();
  const supabase = createClient(supabaseUrl, serviceKey);
  let event: Stripe.Event;

  if (!webhookSecret) {
    return new Response(
      JSON.stringify({
        received: true,
        stub: true,
        message: 'Set STRIPE_WEBHOOK_SECRET to process webhook events',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const stripe = getStripeClient();
  const signature = req.headers.get('stripe-signature');

  try {
    event = stripe.webhooks.constructEvent(body, signature ?? '', webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const tenantIdFromEvent = () => {
    const obj = event.data.object as Record<string, unknown>;
    const meta = (obj.metadata as Record<string, string> | undefined) ?? {};
    return meta.tenant_id ?? (obj.client_reference_id as string | undefined) ?? null;
  };

  await supabase.from('billing_events').upsert(
    {
      stripe_event_id: event.id,
      tenant_id: tenantIdFromEvent(),
      event_type: event.type,
      payload: event,
      processed_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_event_id', ignoreDuplicates: false },
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenant_id ?? session.client_reference_id;
        if (tenantId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
          await syncSubscriptionRecord(supabase, subscription);
          if (session.customer) {
            await supabase
              .from('tenants')
              .update({ stripe_customer_id: String(session.customer) })
              .eq('id', tenantId);
          }
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionRecord(supabase, subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenant_id;
        if (tenantId) {
          await supabase.rpc('upsert_tenant_subscription_from_stripe', {
            p_tenant_id: tenantId,
            p_stripe_customer_id:
              typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer?.id,
            p_stripe_subscription_id: null,
            p_stripe_price_id: null,
            p_plan: subscription.metadata?.target_plan ?? 'starter',
            p_status: 'canceled',
            p_trial_ends_at: null,
            p_current_period_start: null,
            p_current_period_end: null,
            p_cancel_at_period_end: true,
          });
        }
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await syncInvoiceSubscription(stripe, supabase, invoice);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    const message = err instanceof Error ? err.message : 'Webhook handler failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
