import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function extractEmail(value: string) {
  const match = String(value || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0]?.toLowerCase() ?? '';
}

function emailDomain(email: string) {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const expected = Deno.env.get('EMAIL_INBOUND_SECRET') ?? '';
  const provided = req.headers.get('x-webhook-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!expected || provided !== expected) {
    return jsonResponse({ error: 'Unauthorized inbound webhook.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase environment.' }, 500);
  }

  const payload = await req.json().catch(() => ({}));
  const from = extractEmail(String(payload.from ?? payload.sender ?? ''));
  const to = extractEmail(String(payload.to ?? payload.recipient ?? ''));
  const subject = String(payload.subject ?? payload.title ?? 'Email request').trim() || 'Email request';
  const text = String(payload.text ?? payload['stripped-text'] ?? payload.html ?? payload.description ?? '').trim();

  if (!from || !to) return jsonResponse({ error: 'from and to are required.' }, 400);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const domain = emailDomain(to) || emailDomain(from);
  const { data: tenant } = await adminClient
    .from('tenants')
    .select('id, domain')
    .eq('domain', domain)
    .maybeSingle();

  if (!tenant?.id) {
    return jsonResponse({ error: `No workspace matched domain ${domain}.` }, 404);
  }

  const { data: owner } = await adminClient
    .from('profiles')
    .select('id, email, full_name')
    .eq('tenant_id', tenant.id)
    .in('role', ['org_admin', 'super_admin', 'technician'])
    .limit(1)
    .maybeSingle();

  if (!owner?.id) {
    return jsonResponse({ error: 'No workspace owner found to attach the ticket.' }, 404);
  }

  const prefix = 'INC';
  const { data: numbers } = await adminClient
    .from('tickets')
    .select('ticket_number')
    .eq('tenant_id', tenant.id)
    .like('ticket_number', `${prefix}-%`)
    .limit(1000);
  const lastNumber = (numbers ?? []).reduce((max, ticket) => {
    const value = Number(String(ticket.ticket_number ?? '').split('-')[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 1000);

  const { data: ticket, error } = await adminClient
    .from('tickets')
    .insert({
      user_id: owner.id,
      tenant_id: tenant.id,
      ticket_number: `${prefix}-${lastNumber + 1}`,
      title: subject.slice(0, 180),
      description: text || `Inbound email from ${from}`,
      status: 'open',
      ticket_type: 'incident',
      priority: 'medium',
      category: 'Other',
      requester_name: from.split('@')[0],
      requester_email: from,
    })
    .select()
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);

  await adminClient.from('ticket_activity').insert({
    ticket_id: ticket.id,
    user_id: owner.id,
    type: 'system',
    message: `created from inbound email ${from} → ${to}`,
    actor_name: from.split('@')[0],
    actor_email: from,
  });

  return jsonResponse({ ok: true, ticketId: ticket.id, ticketNumber: ticket.ticket_number });
});
