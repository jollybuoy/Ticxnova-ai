import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const allowedRoles = ['org_admin', 'technician', 'employee', 'read_only'];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function randomPassword(length = 14) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return `${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}9!`;
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
  const action = String(payload.action ?? '');
  const tenantUserId = String(payload.tenantUserId ?? '');
  const tenantId = String(payload.tenantId ?? '');

  if (!action || !tenantUserId || !tenantId) {
    return jsonResponse({ error: 'Invalid user administration payload.' }, 400);
  }

  const { data: adminProfile, error: adminError } = await adminClient
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (adminError || adminProfile?.tenant_id !== tenantId) {
    return jsonResponse({ error: 'Tenant access denied.' }, 403);
  }

  if (!['super_admin', 'org_admin'].includes(adminProfile.role)) {
    return jsonResponse({ error: 'Insufficient role permissions.' }, 403);
  }

  const { data: tenantUser, error: userError } = await adminClient
    .from('tenant_users')
    .select('*')
    .eq('id', tenantUserId)
    .eq('tenant_id', tenantId)
    .single();

  if (userError || !tenantUser) return jsonResponse({ error: 'User not found.' }, 404);
  if (tenantUser.user_id === user.id && action === 'delete') {
    return jsonResponse({ error: 'Admins cannot delete their own account.' }, 400);
  }

  if (action === 'delete') {
    await adminClient.from('tenant_users').delete().eq('id', tenantUserId).eq('tenant_id', tenantId);
    if (tenantUser.user_id) {
      await adminClient.from('profiles').delete().eq('id', tenantUser.user_id);
      await adminClient.auth.admin.deleteUser(tenantUser.user_id);
    }
    return jsonResponse({ deletedId: tenantUserId });
  }

  if (action === 'update') {
    const updates = payload.updates ?? {};
    const role = String(updates.role ?? tenantUser.role);
    const fullName = updates.full_name ? String(updates.full_name).trim() : null;
    const department = updates.department ? String(updates.department).trim() : null;
    const isActive =
      typeof updates.is_active === 'boolean' ? updates.is_active : Boolean(tenantUser.is_active);

    if (!allowedRoles.includes(role)) return jsonResponse({ error: 'Invalid role.' }, 400);

    const { data: updated, error: updateError } = await adminClient
      .from('tenant_users')
      .update({ role, full_name: fullName, department, is_active: isActive })
      .eq('id', tenantUserId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) return jsonResponse({ error: updateError.message }, 400);

    if (tenantUser.user_id) {
      await adminClient
        .from('profiles')
        .update({ role, full_name: fullName, department })
        .eq('id', tenantUser.user_id);
      await adminClient.auth.admin.updateUserById(tenantUser.user_id, {
        user_metadata: { role, full_name: fullName, name: fullName, department, tenant_id: tenantId },
        ban_duration: isActive ? 'none' : '876000h',
      });
    }

    return jsonResponse({ user: updated });
  }

  if (action === 'reset_password') {
    if (!tenantUser.user_id) return jsonResponse({ error: 'User has no auth account.' }, 400);
    const temporaryPassword = randomPassword();
    const { error: resetError } = await adminClient.auth.admin.updateUserById(tenantUser.user_id, {
      password: temporaryPassword,
      user_metadata: {
        tenant_id: tenantId,
        role: tenantUser.role,
        department: tenantUser.department,
        must_reset_password: true,
      },
    });
    if (resetError) return jsonResponse({ error: resetError.message }, 400);
    return jsonResponse({ user: tenantUser, temporary_password: temporaryPassword });
  }

  return jsonResponse({ error: 'Unsupported action.' }, 400);
});
