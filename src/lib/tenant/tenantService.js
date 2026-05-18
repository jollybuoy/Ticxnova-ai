import { supabase } from '../supabase';

export const RBAC_ROLES = [
  { value: 'super_admin', label: 'Super Admin', description: 'Platform-wide administration.' },
  { value: 'org_admin', label: 'Org Admin', description: 'Full administration within one tenant.' },
  { value: 'technician', label: 'Technician', description: 'Ticket, device, and operational workflows.' },
  { value: 'employee', label: 'Employee', description: 'Requester and self-service access.' },
  { value: 'read_only', label: 'Read Only', description: 'Auditor access with no write permissions.' },
];

const PUBLIC_EMAIL_DOMAINS = new Set([
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

function getEmailDomain(email) {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

function isFunctionUnavailable(error) {
  return (
    error?.name === 'FunctionsFetchError' ||
    error?.name === 'FunctionsHttpError' ||
    error?.message?.toLowerCase().includes('failed to send a request')
  );
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

export async function inviteTenantUser(tenantId, payload) {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: {
      tenantId,
      emails: payload.emails,
      role: payload.role,
      department: payload.department?.trim() || null,
      redirectTo: `${window.location.origin}/login`,
    },
  });

  if (error && isFunctionUnavailable(error)) {
    const fallback = await stageTenantInvites(tenantId, payload);
    return {
      ...fallback,
      functionUnavailable: true,
      functionError: error,
    };
  }

  return { data, error };
}

async function stageTenantInvites(tenantId, payload) {
  const emails = [...new Set((payload.emails ?? []).map((email) => email.trim().toLowerCase()).filter(Boolean))];
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('domain')
    .eq('id', tenantId)
    .maybeSingle();

  if (tenantError) return { data: null, error: tenantError };

  const tenantDomain = tenant?.domain?.trim().toLowerCase();
  const rejected = [];
  const accepted = [];

  for (const email of emails) {
    const domain = getEmailDomain(email);
    if (!tenantDomain) {
      rejected.push({ email, reason: 'Organization domain is not configured.' });
    } else if (PUBLIC_EMAIL_DOMAINS.has(domain)) {
      rejected.push({ email, reason: 'Public email domains are not allowed for tenant users.' });
    } else if (domain !== tenantDomain) {
      rejected.push({ email, reason: `Email must use the organization domain: ${tenantDomain}.` });
    } else {
      accepted.push(email);
    }
  }

  if (accepted.length === 0) {
    return {
      data: { invited: [], rejected, deliveryMode: 'staged' },
      error: null,
    };
  }

  const { data: invited, error } = await supabase
    .from('tenant_users')
    .upsert(
      accepted.map((email) => ({
        tenant_id: tenantId,
        email,
        role: payload.role,
        department: payload.department?.trim() || null,
        is_active: true,
        invited_at: new Date().toISOString(),
      })),
      { onConflict: 'tenant_id,email' },
    )
    .select();

  return {
    data: {
      invited: invited ?? [],
      rejected,
      deliveryMode: 'staged',
    },
    error,
  };
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

export async function fetchRoles(tenantId) {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
    .order('is_system', { ascending: false })
    .order('name', { ascending: true });

  return { data: data ?? [], error };
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
    return 'Invite email service is not deployed or reachable. Deploy the invite-user Edge Function.';
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
