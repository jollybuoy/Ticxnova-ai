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

function daysSince(isoDate: string | null | undefined) {
  if (!isoDate) return 0;
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

async function assertPlatformAdmin(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data, error } = await adminClient
    .from('platform_admins')
    .select('user_id, email, display_name')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    throw new Error('FORBIDDEN');
  }

  return data;
}

async function listAllAuthUsers(adminClient: ReturnType<typeof createClient>) {
  const users: Array<{
    id: string;
    email?: string;
    created_at?: string;
    last_sign_in_at?: string | null;
    email_confirmed_at?: string | null;
    banned_until?: string | null;
    user_metadata?: Record<string, unknown>;
  }> = [];

  let page = 1;
  const perPage = 200;

  while (page <= 20) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
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

  let platformAdmin;
  try {
    platformAdmin = await assertPlatformAdmin(adminClient, user.id);
  } catch {
    return jsonResponse({ error: 'Platform super admin access required.' }, 403);
  }

  const payload = await req.json().catch(() => ({}));
  const action = String(payload.action ?? '');

  if (action === 'touch_login') {
    await adminClient
      .from('platform_admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', user.id);
    return jsonResponse({ ok: true, admin: platformAdmin });
  }

  if (action === 'get_dashboard') {
    const now = Date.now();
    const day = 86_400_000;
    const since7 = new Date(now - 7 * day).toISOString();
    const since30 = new Date(now - 30 * day).toISOString();

    const [
      tenantsRes,
      profilesRes,
      tenantUsersRes,
      ticketsRes,
      devicesRes,
    ] = await Promise.all([
      adminClient.from('tenants').select('*').order('created_at', { ascending: false }),
      adminClient.from('profiles').select('*').order('created_at', { ascending: false }),
      adminClient.from('tenant_users').select('*'),
      adminClient.from('tickets').select('id, tenant_id, created_at, status'),
      adminClient.from('devices').select('id, tenant_id, created_at'),
    ]);

    if (tenantsRes.error) return jsonResponse({ error: tenantsRes.error.message }, 400);

    const tenants = tenantsRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const authUsers = await listAllAuthUsers(adminClient);
    const authById = new Map(authUsers.map((entry) => [entry.id, entry]));

    const activeTenants = tenants.filter((t) => t.is_active !== false);
    const disabledTenants = tenants.length - activeTenants.length;

    const usersWithAuth = profiles.map((profile) => {
      const authUser = authById.get(profile.id);
      const banned = Boolean(authUser?.banned_until);
      return {
        ...profile,
        auth_created_at: authUser?.created_at ?? null,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        email_confirmed: Boolean(authUser?.email_confirmed_at),
        is_disabled: banned || profile.is_active === false,
        days_since_signup: daysSince(authUser?.created_at ?? profile.created_at),
        days_since_last_login: authUser?.last_sign_in_at
          ? daysSince(authUser.last_sign_in_at)
          : null,
      };
    });

    const signups7d = usersWithAuth.filter(
      (u) => u.auth_created_at && u.auth_created_at >= since7,
    ).length;
    const signups30d = usersWithAuth.filter(
      (u) => u.auth_created_at && u.auth_created_at >= since30,
    ).length;
    const disabledUsers = usersWithAuth.filter((u) => u.is_disabled).length;

    const planBreakdown = tenants.reduce<Record<string, number>>((acc, tenant) => {
      const plan = String(tenant.subscription_plan ?? 'starter').toLowerCase();
      acc[plan] = (acc[plan] ?? 0) + 1;
      return acc;
    }, {});

    const growthMap = new Map<string, { tenants: number; users: number }>();
    for (const tenant of tenants) {
      const key = tenant.created_at?.slice(0, 10) ?? 'unknown';
      const bucket = growthMap.get(key) ?? { tenants: 0, users: 0 };
      bucket.tenants += 1;
      growthMap.set(key, bucket);
    }
    for (const authUser of authUsers) {
      const key = authUser.created_at?.slice(0, 10) ?? 'unknown';
      const bucket = growthMap.get(key) ?? { tenants: 0, users: 0 };
      bucket.users += 1;
      growthMap.set(key, bucket);
    }

    const growthTimeline = [...growthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, counts]) => ({ date, ...counts }));

    const recentWorkspaces = tenants.slice(0, 8).map((tenant) => {
      const tenantProfiles = profiles.filter((p) => p.tenant_id === tenant.id);
      const admins = tenantProfiles.filter((p) =>
        ['super_admin', 'org_admin'].includes(String(p.role))
      );
      return {
        id: tenant.id,
        company_name: tenant.company_name,
        domain: tenant.domain,
        subscription_plan: tenant.subscription_plan,
        is_active: tenant.is_active !== false,
        created_at: tenant.created_at,
        days_since_created: daysSince(tenant.created_at),
        user_count: tenantProfiles.length,
        admin_count: admins.length,
        admin_emails: admins.map((a) => a.email),
      };
    });

    return jsonResponse({
      summary: {
        total_workspaces: tenants.length,
        active_workspaces: activeTenants.length,
        disabled_workspaces: disabledTenants,
        total_users: profiles.length,
        disabled_users: disabledUsers,
        total_tickets: ticketsRes.data?.length ?? 0,
        total_devices: devicesRes.data?.length ?? 0,
        signups_last_7_days: signups7d,
        signups_last_30_days: signups30d,
        tenant_memberships: tenantUsersRes.data?.length ?? 0,
      },
      plan_breakdown: Object.entries(planBreakdown).map(([name, value]) => ({ name, value })),
      growth_timeline: growthTimeline,
      recent_workspaces: recentWorkspaces,
      generated_at: new Date().toISOString(),
    });
  }

  if (action === 'list_workspaces') {
    const { data: tenants, error: tenantsError } = await adminClient
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantsError) return jsonResponse({ error: tenantsError.message }, 400);

    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, tenant_id, email, full_name, role, created_at, is_active');

    const authUsers = await listAllAuthUsers(adminClient);
    const authById = new Map(authUsers.map((entry) => [entry.id, entry]));

    const workspaces = (tenants ?? []).map((tenant) => {
      const members = (profiles ?? []).filter((p) => p.tenant_id === tenant.id);
      const admins = members.filter((p) => ['super_admin', 'org_admin'].includes(String(p.role)));
      const activeMembers = members.filter((m) => {
        const authUser = authById.get(m.id);
        const banned = Boolean(authUser?.banned_until);
        return m.is_active !== false && !banned;
      });

      return {
        ...tenant,
        is_active: tenant.is_active !== false,
        days_since_created: daysSince(tenant.created_at),
        user_count: members.length,
        active_user_count: activeMembers.length,
        admin_accounts: admins.map((admin) => ({
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          role: admin.role,
          created_at: admin.created_at,
          days_since_created: daysSince(admin.created_at),
          is_disabled:
            admin.is_active === false || Boolean(authById.get(admin.id)?.banned_until),
          last_sign_in_at: authById.get(admin.id)?.last_sign_in_at ?? null,
        })),
      };
    });

    return jsonResponse({ workspaces });
  }

  if (action === 'list_users') {
    const search = String(payload.search ?? '').trim().toLowerCase();

    const [{ data: profiles, error: profilesError }, { data: tenants }] = await Promise.all([
      adminClient.from('profiles').select('*').order('created_at', { ascending: false }),
      adminClient.from('tenants').select('id, company_name, domain, subscription_plan, is_active'),
    ]);

    if (profilesError) return jsonResponse({ error: profilesError.message }, 400);

    const tenantById = new Map((tenants ?? []).map((tenant) => [tenant.id, tenant]));
    const authUsers = await listAllAuthUsers(adminClient);
    const authById = new Map(authUsers.map((entry) => [entry.id, entry]));

    let users = (profiles ?? []).map((profile) => {
      const authUser = authById.get(profile.id);
      const tenant = profile.tenant_id ? tenantById.get(profile.tenant_id) ?? null : null;
      const banned = Boolean(authUser?.banned_until);
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        tenant_id: profile.tenant_id,
        workspace_domain: tenant?.domain ?? null,
        workspace_name: tenant?.company_name ?? null,
        workspace_active: tenant?.is_active !== false,
        subscription_plan: tenant?.subscription_plan ?? null,
        created_at: profile.created_at,
        auth_created_at: authUser?.created_at ?? null,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        email_confirmed: Boolean(authUser?.email_confirmed_at),
        is_disabled: banned || profile.is_active === false,
        days_since_signup: daysSince(authUser?.created_at ?? profile.created_at),
        days_since_last_login: authUser?.last_sign_in_at
          ? daysSince(authUser.last_sign_in_at)
          : null,
      };
    });

    if (search) {
      users = users.filter(
        (entry) =>
          entry.email?.toLowerCase().includes(search) ||
          entry.full_name?.toLowerCase().includes(search) ||
          entry.workspace_domain?.toLowerCase().includes(search) ||
          entry.workspace_name?.toLowerCase().includes(search),
      );
    }

    return jsonResponse({ users });
  }

  if (action === 'set_workspace_status') {
    const tenantId = String(payload.tenantId ?? '');
    const isActive = Boolean(payload.isActive);

    if (!tenantId) return jsonResponse({ error: 'tenantId is required.' }, 400);

    const { data: tenant, error: updateError } = await adminClient
      .from('tenants')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', tenantId)
      .select()
      .single();

    if (updateError) return jsonResponse({ error: updateError.message }, 400);

    if (!isActive) {
      const { data: members } = await adminClient
        .from('profiles')
        .select('id')
        .eq('tenant_id', tenantId);

      for (const member of members ?? []) {
        await adminClient.from('profiles').update({ is_active: false }).eq('id', member.id);
        await adminClient.from('tenant_users').update({ is_active: false }).eq('user_id', member.id);
        await adminClient.auth.admin.updateUserById(member.id, { ban_duration: '876000h' });
      }
    }

    return jsonResponse({ workspace: tenant });
  }

  if (action === 'set_user_status') {
    const targetUserId = String(payload.userId ?? '');
    const isActive = Boolean(payload.isActive);

    if (!targetUserId) return jsonResponse({ error: 'userId is required.' }, 400);
    if (targetUserId === user.id && !isActive) {
      return jsonResponse({ error: 'You cannot disable your own super admin account.' }, 400);
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', targetUserId)
      .select()
      .single();

    if (profileError) return jsonResponse({ error: profileError.message }, 400);

    await adminClient
      .from('tenant_users')
      .update({ is_active: isActive })
      .eq('user_id', targetUserId);

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
      ban_duration: isActive ? 'none' : '876000h',
    });

    if (authUpdateError) return jsonResponse({ error: authUpdateError.message }, 400);

    return jsonResponse({ user: profile, is_active: isActive });
  }

  if (action === 'list_verifications') {
    const { data: tenants, error: tenantsError } = await adminClient
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantsError) return jsonResponse({ error: tenantsError.message }, 400);

    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, tenant_id, email, full_name, role, created_at');

    const all = tenants ?? [];
    const pending = all.filter(
      (t) =>
        !t.domain_verified &&
        ['pending_domain_verification', 'under_review'].includes(String(t.verification_status)),
    );
    const verified = all.filter((t) => t.domain_verified && t.verification_status === 'verified');
    const rejected = all.filter((t) => t.verification_status === 'rejected');

    const domainMap = new Map<string, typeof all>();
    for (const tenant of all) {
      const key = String(tenant.domain ?? '').toLowerCase();
      if (!key) continue;
      const group = domainMap.get(key) ?? [];
      group.push(tenant);
      domainMap.set(key, group);
    }

    const duplicate_domains = [...domainMap.entries()]
      .filter(([, group]) => group.length > 1)
      .map(([domain, group]) => ({
        domain,
        count: group.length,
        workspaces: group.map((tenant) => {
          const admins = (profiles ?? []).filter(
            (p) =>
              p.tenant_id === tenant.id &&
              ['super_admin', 'org_admin'].includes(String(p.role)),
          );
          return {
            id: tenant.id,
            company_name: tenant.company_name,
            verification_status: tenant.verification_status,
            domain_verified: tenant.domain_verified,
            created_at: tenant.created_at,
            admin_emails: admins.map((a) => a.email),
          };
        }),
      }));

    const enrich = (tenant: (typeof all)[number]) => {
      const admins = (profiles ?? []).filter(
        (p) =>
          p.tenant_id === tenant.id && ['super_admin', 'org_admin'].includes(String(p.role)),
      );
      return {
        ...tenant,
        days_since_created: daysSince(tenant.created_at),
        admin_emails: admins.map((a) => a.email),
      };
    };

    return jsonResponse({
      pending: pending.map(enrich),
      duplicate_domains,
      verified: verified.map(enrich),
      rejected: rejected.map(enrich),
    });
  }

  if (action === 'approve_verification' || action === 'manual_verify_domain') {
    const tenantId = String(payload.tenantId ?? '');
    if (!tenantId) return jsonResponse({ error: 'tenantId is required.' }, 400);

    const { data: activation, error: activationError } = await adminClient.rpc(
      'activate_tenant_domain',
      {
        target_tenant_id: tenantId,
        target_method: 'platform_admin',
        target_approved_by: user.id,
      },
    );

    if (activationError) return jsonResponse({ error: activationError.message }, 400);
    if (activation?.success === false) {
      return jsonResponse({ error: activation.message }, 400);
    }

    return jsonResponse({ success: true, activation });
  }

  if (action === 'reject_verification') {
    const tenantId = String(payload.tenantId ?? '');
    const reason = String(payload.reason ?? 'Rejected by platform administrator.');
    if (!tenantId) return jsonResponse({ error: 'tenantId is required.' }, 400);

    const { data: result, error: rejectError } = await adminClient.rpc(
      'reject_tenant_verification',
      {
        target_tenant_id: tenantId,
        target_reason: reason,
        target_rejected_by: user.id,
      },
    );

    if (rejectError) return jsonResponse({ error: rejectError.message }, 400);
    return jsonResponse({ success: true, result });
  }

  if (action === 'delete_workspace') {
    const tenantId = String(payload.tenantId ?? '');
    if (!tenantId) return jsonResponse({ error: 'tenantId is required.' }, 400);

    const { data: members } = await adminClient.from('profiles').select('id').eq('tenant_id', tenantId);

    for (const member of members ?? []) {
      if (member.id === user.id) continue;
      await adminClient.from('tenant_users').delete().eq('user_id', member.id);
      await adminClient.from('profiles').delete().eq('id', member.id);
      await adminClient.auth.admin.deleteUser(member.id);
    }

    const { error: deleteError } = await adminClient.from('tenants').delete().eq('id', tenantId);
    if (deleteError) return jsonResponse({ error: deleteError.message }, 400);

    return jsonResponse({ deleted_tenant_id: tenantId });
  }

  return jsonResponse({ error: 'Unsupported action.' }, 400);
});
