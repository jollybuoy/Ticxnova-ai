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
const passwordAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalizeUsers(payload: Record<string, unknown>): Array<{ email: string; full_name: string | null; department: string | null }> {
  if (Array.isArray(payload.users)) {
    const seen = new Set<string>();
    return payload.users
      .map((item) => {
        const record = item as Record<string, unknown>;
        return {
          email: String(record.email ?? '').trim().toLowerCase(),
          full_name: record.full_name ? String(record.full_name).trim() : null,
          department: record.department ? String(record.department).trim() : null,
        };
      })
      .filter((item) => {
        if (!item.email || seen.has(item.email)) return false;
        seen.add(item.email);
        return true;
      })
      .slice(0, 250);
  }

  const values = Array.isArray(payload.emails ?? payload.email) ? payload.emails ?? payload.email : [payload.emails ?? payload.email];
  const seen = new Set<string>();
  return values
    .flatMap((item) => String(item ?? '').split(/[\s,;]+/))
    .map((email) => email.trim().toLowerCase())
    .filter((email) => {
      if (!email || seen.has(email)) return false;
      seen.add(email);
      return true;
    })
    .slice(0, 250)
    .map((email) => ({ email, full_name: null, department: null }));
}

function emailDomain(email: string) {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

function generateTemporaryPassword(length = 14) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  const password = Array.from(bytes, (byte) => passwordAlphabet[byte % passwordAlphabet.length]).join('');
  return `${password}9!`;
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
  const users = normalizeUsers(payload);
  const role = String(payload.role ?? 'employee');
  const defaultDepartment = payload.department ? String(payload.department).trim() : null;

  if (!tenantId || users.length === 0 || !allowedRoles.includes(role)) {
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
  const roleRequiresTenantDomain = role !== 'org_admin';

  if (roleRequiresTenantDomain && !tenantDomain) {
    return jsonResponse({
      error: 'Set an organization domain before inviting users.',
      invited: [],
      rejected: users.map((item) => ({ email: item.email, reason: 'Organization domain is not configured.' })),
    });
  }

  if (roleRequiresTenantDomain && blockedPublicDomains.has(tenantDomain)) {
    return jsonResponse({
      error: 'Organization domain cannot be a public email provider.',
      invited: [],
      rejected: users.map((item) => ({ email: item.email, reason: `${tenantDomain} is not allowed for tenant invitations.` })),
    });
  }

  const invited = [];
  const rejected = [];

  for (const item of users) {
    const email = item.email;
    const fullName = item.full_name;
    const department = item.department || defaultDepartment;
    const domain = emailDomain(email);
    if (!emailPattern.test(email)) {
      rejected.push({ email, reason: 'Invalid email address.' });
      continue;
    }

    if (roleRequiresTenantDomain && blockedPublicDomains.has(domain)) {
      rejected.push({ email, reason: 'Public email domains are not allowed for tenant users.' });
      continue;
    }

    if (roleRequiresTenantDomain && domain !== tenantDomain) {
      rejected.push({ email, reason: `Email must use the organization domain: ${tenantDomain}.` });
      continue;
    }

    const temporaryPassword = generateTemporaryPassword();
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        tenant_id: tenantId,
        full_name: fullName,
        name: fullName,
        role,
        department,
        must_reset_password: true,
      },
    });

    if (createError) {
      rejected.push({ email, reason: createError.message });
      continue;
    }

    const userId = created.user?.id ?? null;

    if (userId) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({
          id: userId,
          tenant_id: tenantId,
          email,
          full_name: fullName,
          role,
          department,
        });

      if (profileError) {
        rejected.push({ email, reason: profileError.message });
        continue;
      }
    }

    const { data: tenantUser, error: memberError } = await adminClient
      .from('tenant_users')
      .upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          email,
          full_name: fullName,
          role,
          department,
          is_active: true,
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,email' },
      )
      .select()
      .single();

    if (memberError) {
      rejected.push({ email, reason: memberError.message });
      continue;
    }

    invited.push({
      ...tenantUser,
      temporary_password: temporaryPassword,
      must_reset_password: true,
    });
  }

  return jsonResponse({
    invited,
    rejected,
    total: users.length,
    successCount: invited.length,
    rejectedCount: rejected.length,
    deliveryMode: 'temporary_password',
  });
});
