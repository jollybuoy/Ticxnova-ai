import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

async function lookupTxtRecords(domain: string) {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('DNS lookup failed.');
  }
  const payload = await response.json();
  const answers = payload?.Answer ?? [];
  const values: string[] = [];

  for (const answer of answers) {
    const raw = String(answer?.data ?? '');
    const cleaned = raw.replace(/^"|"$/g, '').replace(/"/g, '');
    values.push(cleaned);
  }

  return values;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase environment variables.' }, 500);
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

  if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const payload = await req.json().catch(() => ({}));
  const action = String(payload.action ?? '');

  const { data: profile } = await adminClient
    .from('profiles')
    .select('tenant_id, email, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.tenant_id) {
    return jsonResponse({ error: 'No workspace found for this account.' }, 404);
  }

  const { data: tenant, error: tenantError } = await adminClient
    .from('tenants')
    .select('*')
    .eq('id', profile.tenant_id)
    .single();

  if (tenantError || !tenant) {
    return jsonResponse({ error: 'Workspace not found.' }, 404);
  }

  if (action === 'verify_dns') {
    if (!tenant.domain || !tenant.verification_token) {
      return jsonResponse({ error: 'Verification token is not ready.' }, 400);
    }

    try {
      const txtValues = await lookupTxtRecords(tenant.domain);
      const matched = txtValues.some((value) => value.includes(tenant.verification_token));

      if (!matched) {
        await adminClient
          .from('tenants')
          .update({
            verification_status: 'pending_domain_verification',
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenant.id);

        return jsonResponse({
          success: false,
          verified: false,
          message: 'TXT record not found yet. DNS changes can take up to 24 hours.',
          checked_values: txtValues,
        });
      }

      const { data: activation, error: activationError } = await adminClient.rpc(
        'activate_tenant_domain',
        {
          target_tenant_id: tenant.id,
          target_method: 'dns_txt',
          target_approved_by: null,
        },
      );

      if (activationError) {
        return jsonResponse({ error: activationError.message }, 400);
      }

      if (activation?.success === false) {
        return jsonResponse({ success: false, verified: false, message: activation.message });
      }

      return jsonResponse({
        success: true,
        verified: true,
        message: 'Domain verified successfully via DNS TXT record.',
      });
    } catch (error) {
      return jsonResponse({
        success: false,
        verified: false,
        message: error instanceof Error ? error.message : 'DNS verification failed.',
      });
    }
  }

  if (action === 'verify_business_email') {
    const userEmail = String(user.email ?? profile.email ?? '').toLowerCase();
    const domain = String(tenant.domain ?? '').toLowerCase();
    const emailDomain = userEmail.split('@')[1] ?? '';

    if (!domain || emailDomain !== domain) {
      return jsonResponse({
        success: false,
        verified: false,
        message: `Sign in with a work email at @${domain} to verify by business email.`,
      });
    }

    const { data: activation, error: activationError } = await adminClient.rpc(
      'activate_tenant_domain',
      {
        target_tenant_id: tenant.id,
        target_method: 'business_email',
        target_approved_by: null,
      },
    );

    if (activationError) {
      return jsonResponse({ error: activationError.message }, 400);
    }

    if (activation?.success === false) {
      return jsonResponse({ success: false, verified: false, message: activation.message });
    }

    await adminClient
      .from('tenants')
      .update({ business_email_verified_at: new Date().toISOString() })
      .eq('id', tenant.id);

    return jsonResponse({
      success: true,
      verified: true,
      message: 'Domain verified using your business email address.',
    });
  }

  if (action === 'request_review') {
    await adminClient.rpc('mark_tenant_under_review', { target_tenant_id: tenant.id });
    return jsonResponse({
      success: true,
      message: 'Verification submitted for platform review.',
    });
  }

  return jsonResponse({ error: 'Unsupported action.' }, 400);
});
