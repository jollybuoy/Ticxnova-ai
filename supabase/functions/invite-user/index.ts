import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const allowedRoles = ['org_admin', 'technician', 'employee', 'read_only'];
const blockedPublicDomains = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalizeEmails(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  const raw = values
    .flatMap((item) => String(item ?? '').split(/[\s,;]+/))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(raw)].slice(0, 250);
}

function emailDomain(email: string) {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase function environment variables.' }, 500);
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
  const tenantId = String(payload.tenantId ?? '');
  const emails = normalizeEmails(payload.emails ?? payload.email);
  const role = String(payload.role ?? 'employee');
  const department = payload.department ? String(payload.department).trim() : null;

  if (!tenantId || emails.length === 0 || !allowedRoles.includes(role)) {
    return jsonResponse({ error: 'Invalid invitation payload.' }, 400);
  }

  const { data: inviter, error: inviterError } = await adminClient
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (inviterError || inviter?.tenant_id !== tenantId) {
    return jsonResponse({ error: 'Tenant access denied.' }, 403);
  }

  if (!['super_admin', 'org_admin'].includes(inviter.role)) {
    return jsonResponse({ error: 'Insufficient role permissions.' }, 403);
  }

  const { data: tenant, error: tenantError } = await adminClient
    .from('tenants')
    .select('id, domain')
    .eq('id', tenantId)
    .single();

  if (tenantError || !tenant) return jsonResponse({ error: 'Tenant not found.' }, 404);

  const tenantDomain = String(tenant.domain ?? '').trim().toLowerCase();
  if (!tenantDomain) {
    return jsonResponse({
      error: 'Set an organization domain before inviting users.',
      invited: [],
      rejected: emails.map((email) => ({ email, reason: 'Organization domain is not configured.' })),
    });
  }

  if (blockedPublicDomains.has(tenantDomain)) {
    return jsonResponse({
      error: 'Organization domain cannot be a public email provider.',
      invited: [],
      rejected: emails.map((email) => ({ email, reason: `${tenantDomain} is not allowed for tenant invitations.` })),
    });
  }

  const redirectTo = payload.redirectTo
    ? String(payload.redirectTo)
    : `${req.headers.get('origin') ?? ''}/login`;

  const invited = [];
  const rejected = [];

  for (const email of emails) {
    const domain = emailDomain(email);
    if (!emailPattern.test(email)) {
      rejected.push({ email, reason: 'Invalid email address.' });
      continue;
    }

    if (blockedPublicDomains.has(domain)) {
      rejected.push({ email, reason: 'Public email domains are not allowed for tenant users.' });
      continue;
    }

    if (domain !== tenantDomain) {
      rejected.push({ email, reason: `Email must use the organization domain: ${tenantDomain}.` });
      continue;
    }

    const { data: invite, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        tenant_id: tenantId,
        role,
        department,
      },
    });

    if (inviteError) {
      rejected.push({ email, reason: inviteError.message });
      continue;
    }

    const { data: tenantUser, error: memberError } = await adminClient
      .from('tenant_users')
      .upsert(
        {
          tenant_id: tenantId,
          user_id: invite.user?.id ?? null,
          email,
          role,
          department,
          is_active: true,
          invited_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,email' },
      )
      .select()
      .single();

    if (memberError) {
      rejected.push({ email, reason: memberError.message });
      continue;
    }

    invited.push(tenantUser);
  }

  return jsonResponse({
    invited,
    rejected,
    total: emails.length,
    successCount: invited.length,
    rejectedCount: rejected.length,
  });
});
