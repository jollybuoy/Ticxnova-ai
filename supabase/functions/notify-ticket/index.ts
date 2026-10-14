import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  brandedTicketCopy,
  decryptSecret,
  isMailReady,
  normalizeMailConfig,
  sendTenantMail,
  ticketMailRecipients,
} from '../_shared/tenantMail.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase environment.' }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get('authorization') ?? '' } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const payload = await req.json().catch(() => ({}));
  const ticketId = String(payload.ticketId ?? '');
  const event = String(payload.event ?? '');
  const message = payload.message ? String(payload.message) : '';
  if (!ticketId || !event) return jsonResponse({ error: 'ticketId and event are required.' }, 400);

  const { data: ticket, error: ticketError } = await adminClient
    .from('tickets')
    .select('id, title, ticket_number, status, requester_email, requester_name, tenant_id')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) return jsonResponse({ error: 'Ticket not found.' }, 404);

  const { data: profile } = await adminClient
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.tenant_id && ticket.tenant_id && profile.tenant_id !== ticket.tenant_id) {
    return jsonResponse({ error: 'Tenant access denied.' }, 403);
  }

  const { data: tenant } = await adminClient
    .from('tenants')
    .select('id, company_name, mail_config')
    .eq('id', ticket.tenant_id)
    .maybeSingle();

  const config = normalizeMailConfig(tenant?.mail_config);
  const { data: secretRow } = await adminClient
    .from('tenant_mail_secrets')
    .select('secret_cipher')
    .eq('tenant_id', ticket.tenant_id)
    .maybeSingle();

  if (!isMailReady(config, Boolean(secretRow?.secret_cipher))) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: 'organization_mail_not_configured',
    });
  }

  const secret = await decryptSecret(secretRow.secret_cipher);
  const origin = req.headers.get('origin') || Deno.env.get('SITE_URL') || 'https://ticxnova.com';
  const recipients = ticketMailRecipients(config, ticket, event);
  if (recipients.length === 0) {
    return jsonResponse({ ok: true, skipped: true, reason: 'no_recipients' });
  }

  const results = [];
  for (const recipient of recipients) {
    const copy = brandedTicketCopy({
      companyName: tenant?.company_name || 'IT',
      event,
      ticket,
      message,
      audience: recipient.audience,
      origin,
    });
    const sent = await sendTenantMail(config, secret, {
      to: recipient.email,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
    });
    results.push({ to: recipient.email, audience: recipient.audience, ...sent });
  }

  return jsonResponse({ ok: true, results });
});
