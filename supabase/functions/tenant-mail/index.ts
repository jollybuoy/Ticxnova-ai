import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  brandedTicketCopy,
  decryptSecret,
  encryptSecret,
  isMailReady,
  normalizeMailConfig,
  publicMailConfig,
  sendTenantMail,
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
  const action = String(payload.action ?? 'status');
  const tenantId = String(payload.tenantId ?? '');
  if (!tenantId) return jsonResponse({ error: 'tenantId is required.' }, 400);

  const { data: profile } = await adminClient
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.tenant_id !== tenantId || !['super_admin', 'org_admin'].includes(String(profile?.role))) {
    return jsonResponse({ error: 'Only organization admins can manage the mail relay.' }, 403);
  }

  const { data: tenant } = await adminClient
    .from('tenants')
    .select('id, company_name, mail_config')
    .eq('id', tenantId)
    .single();
  if (!tenant) return jsonResponse({ error: 'Workspace not found.' }, 404);

  const { data: secretRow } = await adminClient
    .from('tenant_mail_secrets')
    .select('secret_cipher')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (action === 'status') {
    const config = normalizeMailConfig(tenant.mail_config);
    return jsonResponse({
      config: publicMailConfig(config),
      hasSecret: Boolean(secretRow?.secret_cipher),
      ready: isMailReady(config, Boolean(secretRow?.secret_cipher)),
    });
  }

  if (action === 'save') {
    const config = normalizeMailConfig(payload.config);
    const secret = String(payload.secret ?? '').trim();
    const { error: configError } = await adminClient
      .from('tenants')
      .update({ mail_config: publicMailConfig(config) })
      .eq('id', tenantId);
    if (configError) return jsonResponse({ error: configError.message }, 500);

    if (secret) {
      const cipher = await encryptSecret(secret);
      const { error: secretError } = await adminClient
        .from('tenant_mail_secrets')
        .upsert({ tenant_id: tenantId, secret_cipher: cipher, updated_at: new Date().toISOString() });
      if (secretError) return jsonResponse({ error: secretError.message }, 500);
    }

    return jsonResponse({
      ok: true,
      config: publicMailConfig(config),
      hasSecret: Boolean(secret || secretRow?.secret_cipher),
      ready: isMailReady(config, Boolean(secret || secretRow?.secret_cipher)),
    });
  }

  if (action === 'test') {
    const config = normalizeMailConfig(payload.config ?? tenant.mail_config);
    const incomingSecret = String(payload.secret ?? '').trim();
    const secret = incomingSecret || (secretRow?.secret_cipher ? await decryptSecret(secretRow.secret_cipher) : '');
    const to = String(payload.to ?? config.it_inbox ?? config.from_email).trim();
    if (!isMailReady(config, Boolean(secret))) {
      return jsonResponse({ error: 'Save your From address and mailbox password or API key first.' }, 400);
    }
    const copy = brandedTicketCopy({
      companyName: tenant.company_name || 'IT',
      event: 'created',
      ticket: { title: 'Mail relay test', ticket_number: 'TEST', requester_name: 'Admin' },
      audience: 'it',
    });
    const sent = await sendTenantMail(config, secret, {
      to,
      subject: `[${tenant.company_name || 'IT'}] Test email from your ticketing mailbox`,
      text: `${copy.text}\n\nThis is a test from Organization Settings.`,
      html: copy.html,
    });
    if (!sent.ok) return jsonResponse({ error: sent.error || 'Test send failed.' }, 502);
    return jsonResponse({ ok: true, to });
  }

  return jsonResponse({ error: 'Unknown action.' }, 400);
});
