import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  assertBillingAdmin,
  corsHeaders,
  ensureStripeCustomer,
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
    const stripe = getStripeClient();
    const customerId = await ensureStripeCustomer(stripe, adminClient, tenant, profile, user);

    const origin = req.headers.get('origin') ?? '';
    const returnUrl = String(payload.returnUrl ?? `${origin}/settings/billing`);

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return jsonResponse({ url: portal.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Billing portal failed';
    return jsonResponse({ error: message }, 500);
  }
});
