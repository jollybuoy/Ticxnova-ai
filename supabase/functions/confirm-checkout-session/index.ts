import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  assertBillingAdmin,
  corsHeaders,
  getStripeClient,
  jsonResponse,
  syncFromCheckoutSession,
} from '../_shared/stripeBilling.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const auth = await assertBillingAdmin(req);
    if ('error' in auth) return auth.error;

    const { tenant } = auth;
    const payload = await req.json().catch(() => ({}));
    const sessionId = String(payload.sessionId ?? payload.session_id ?? '');

    if (!sessionId.startsWith('cs_')) {
      return jsonResponse({ error: 'A valid Stripe Checkout session ID is required.' }, 400);
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const result = await syncFromCheckoutSession(stripe, auth.adminClient, session, tenant.id);

    if ('reason' in result && result.reason === 'tenant_mismatch') {
      return jsonResponse({ error: 'This checkout session belongs to another workspace.' }, 403);
    }

    const unlocked = Boolean(result.synced && 'status' in result && result.status === 'active');

    return jsonResponse({
      unlocked,
      status: result.synced && 'status' in result ? result.status : session.status,
      plan: result.synced && 'plan' in result ? result.plan : null,
      subscriptionId: result.synced && 'subscriptionId' in result ? result.subscriptionId : null,
      paymentStatus: session.payment_status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not confirm checkout';
    return jsonResponse({ error: message }, 500);
  }
});
