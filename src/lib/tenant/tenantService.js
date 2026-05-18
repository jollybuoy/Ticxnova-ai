import { supabase } from '../supabase';

export const RBAC_ROLES = [
  { value: 'super_admin', label: 'Super Admin', description: 'Platform-wide administration.' },
  { value: 'org_admin', label: 'Org Admin', description: 'Full administration within one tenant.' },
  { value: 'technician', label: 'Technician', description: 'Ticket, device, and operational workflows.' },
  { value: 'employee', label: 'Employee', description: 'Requester and self-service access.' },
  { value: 'read_only', label: 'Read Only', description: 'Auditor access with no write permissions.' },
];

function isFunctionUnavailable(error) {
  return (
    error?.name === 'FunctionsFetchError' ||
    error?.name === 'FunctionsHttpError' ||
    error?.message?.toLowerCase().includes('failed to send a request')
  );
}

function normalizeCreatedUsers(data) {
  return {
    ...data,
    invited: (data?.invited ?? []).map((user) => ({
      ...user,
      temporary_password: user.temporary_password,
    })),
  };
}

export async function fetchTenantContext(userId) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) return { profile: null, tenant: null, error: profileError };
  if (!profile?.tenant_id) return { profile, tenant: null, error: null };

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', profile.tenant_id)
    .maybeSingle();

  return { profile, tenant, error: tenantError };
}

export async function ensureTenantForUser(user, fullName) {
  const { data: tenantId, error } = await supabase.rpc('ensure_user_tenant', {
    target_user_id: user.id,
    target_email: user.email,
    target_full_name: fullName || user.user_metadata?.full_name || user.user_metadata?.name || null,
  });

  if (error) return { data: null, error };
  return fetchTenantContext(user.id).then((context) => ({
    data: { tenantId, profile: context.profile, tenant: context.tenant },
    error: context.error,
  }));
}

export async function updateTenant(tenantId, updates) {
  const { error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenantId);

  if (error) return { data: null, error };

  const { data, error: fetchError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .maybeSingle();

  return { data, error: fetchError };
}

export async function updateProfile(userId, updates) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) return { data: null, error };

  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return { data, error: fetchError };
}

export async function fetchTenantUsers(tenantId) {
  const { data, error } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}

function dedupeRoles(roles) {
  return [
    ...new Map(
      roles.map((role) => [
        `${role.tenant_id ?? 'system'}:${role.name}`,
        role,
      ]),
    ).values(),
  ];
}

export async function inviteTenantUser(tenantId, payload) {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: {
      tenantId,
      emails: payload.emails,
      users: payload.users,
      role: payload.role,
      department: payload.department?.trim() || null,
      redirectTo: `${window.location.origin}/login`,
    },
  });

  if (error && isFunctionUnavailable(error)) {
    return {
      data: null,
      error: {
        ...error,
        message: 'User provisioning service is not deployed. Deploy the invite-user Edge Function to create users.',
      },
    };
  }

  return { data: normalizeCreatedUsers(data), error };
}

export async function updateTenantUser(userId, updates) {
  const { data, error } = await supabase
    .from('tenant_users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
}

export async function adminUpdateTenantUser(tenantId, tenantUserId, updates) {
  const { data, error } = await supabase.functions.invoke('user-admin', {
    body: {
      action: 'update',
      tenantId,
      tenantUserId,
      updates,
    },
  });

  return { data: data?.user ?? null, error };
}

export async function adminDeleteTenantUser(tenantId, tenantUserId) {
  const { data, error } = await supabase.functions.invoke('user-admin', {
    body: {
      action: 'delete',
      tenantId,
      tenantUserId,
    },
  });

  return { data, error };
}

export async function adminResetTenantUserPassword(tenantId, tenantUserId) {
  const { data, error } = await supabase.functions.invoke('user-admin', {
    body: {
      action: 'reset_password',
      tenantId,
      tenantUserId,
    },
  });

  return { data, error };
}

export async function fetchRoles(tenantId) {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
    .order('is_system', { ascending: false })
    .order('name', { ascending: true });

  return { data: dedupeRoles(data ?? []), error };
}

export async function createCustomRole(tenantId, payload) {
  const { data, error } = await supabase
    .from('roles')
    .insert({
      tenant_id: tenantId,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      permissions: payload.permissions ?? {},
      is_system: false,
    })
    .select()
    .single();

  return { data, error };
}

export async function uploadTenantLogo(tenantId, file) {
  const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, '-').toLowerCase();
  const path = `${tenantId}/logo-${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('tenant-branding').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) return { data: null, error };

  const { data } = supabase.storage.from('tenant-branding').getPublicUrl(path);
  return { data: data.publicUrl, error: null };
}

export function getTenantErrorMessage(error) {
  if (!error) return 'Something went wrong.';
  if (isFunctionUnavailable(error)) {
    return 'User provisioning service is not deployed or reachable. Deploy the invite-user Edge Function.';
  }
  if (error.code === '42P01') return 'Tenant tables not found. Run supabase/multi-tenant-rbac.sql.';
  if (error.code === '42703') return 'Tenant schema is incomplete. Re-run supabase/multi-tenant-rbac.sql.';
  if (error.code === 'PGRST116') return 'No tenant record was returned. Sign out and back in, or re-run the multi-tenant migration.';
  return error.message ?? 'Something went wrong.';
}

export function canManageUsers(role) {
  return ['super_admin', 'org_admin'].includes(role);
}

export function canManageOperations(role) {
  return ['super_admin', 'org_admin', 'technician'].includes(role);
}
