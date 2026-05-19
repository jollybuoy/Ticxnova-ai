import { supabase } from '../supabase';

export const WORKSPACE_PLANS = ['starter', 'professional', 'enterprise'];

export function normalizeWorkspaceDomain(value) {
  if (!value) return '';
  let cleaned = value.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./, '');
  cleaned = cleaned.split('/')[0];
  return cleaned;
}

export function isValidWorkspacePlan(plan) {
  return WORKSPACE_PLANS.includes(String(plan || '').toLowerCase());
}

export function isWorkspaceOnboardingFlag(metadata = {}) {
  const value = metadata.workspace_onboarding;
  if (value === true) return true;
  const normalized = String(value ?? '').toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

export function isWorkspaceOnboardingPending(user) {
  if (!user) return false;
  const metadata = user.user_metadata ?? {};
  if (isWorkspaceOnboardingFlag(metadata)) return true;
  return Boolean(metadata.company_name && metadata.domain);
}

let finalizeInFlight = false;

/** Best-effort provisioning after sign-in (e.g. email confirmation) using signup metadata. */
export async function tryFinalizePendingWorkspace(user) {
  if (!user || finalizeInFlight || !isWorkspaceOnboardingPending(user)) {
    return { attempted: false, success: false };
  }

  const status = await getMyWorkspaceStatus();
  if (status.data?.has_tenant) {
    return { attempted: false, success: true };
  }

  const metadata = user.user_metadata ?? {};
  const companyName = metadata.company_name;
  const domain = metadata.domain;
  if (!companyName || !domain) {
    return { attempted: false, success: false };
  }

  finalizeInFlight = true;
  try {
    const result = await finalizeWorkspaceOnboarding({
      companyName,
      domain,
      plan: metadata.subscription_plan || 'starter',
      fullName: metadata.full_name || metadata.name,
    });
    return { attempted: true, success: result.success, message: result.message };
  } finally {
    finalizeInFlight = false;
  }
}

export async function checkWorkspaceSignupAvailability({ email, domain, plan }) {
  const { data, error } = await supabase.rpc('check_workspace_signup_available', {
    target_email: email.trim(),
    target_domain: normalizeWorkspaceDomain(domain),
    target_plan: plan,
  });

  if (error) {
    return {
      available: false,
      code: 'rpc_error',
      message: getOnboardingErrorMessage(error),
    };
  }

  return data ?? { available: false, code: 'unknown', message: 'Unable to validate workspace details.' };
}

export async function getMyWorkspaceStatus() {
  const { data, error } = await supabase.rpc('get_my_workspace_status');
  if (error) {
    return { success: false, error, data: null };
  }
  return { success: true, error: null, data };
}

export async function finalizeWorkspaceOnboarding({ companyName, domain, plan, fullName }) {
  const { data, error } = await supabase.rpc('finalize_workspace_onboarding', {
    target_company_name: companyName.trim(),
    target_domain: normalizeWorkspaceDomain(domain),
    target_plan: plan,
    target_full_name: fullName?.trim() || null,
  });

  if (error) {
    return {
      success: false,
      message: getOnboardingErrorMessage(error),
      tenantId: null,
    };
  }

  if (!data?.success) {
    const provisionMessage = data?.message || 'Workspace provisioning failed.';
    return {
      success: false,
      message: getOnboardingErrorMessage({ message: provisionMessage, detail: data?.detail }),
      tenantId: null,
    };
  }

  return {
    success: true,
    message: data.message,
    tenantId: data.tenant_id,
  };
}

export async function fetchWorkspaceContext(userId) {
  const status = await getMyWorkspaceStatus();
  if (status.success && status.data?.has_tenant) {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, company_name, domain, subscription_plan, created_at, is_active')
      .eq('id', status.data.tenant_id)
      .maybeSingle();

    return {
      profile: {
        id: userId,
        tenant_id: status.data.tenant_id,
        role: status.data.role,
        email: null,
        full_name: null,
      },
      tenant,
      error: tenantError,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, tenant_id, email, full_name, role, department, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) return { profile: null, tenant: null, error: profileError };
  if (!profile?.tenant_id) return { profile, tenant: null, error: null };

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, company_name, domain, subscription_plan, created_at, is_active')
    .eq('id', profile.tenant_id)
    .maybeSingle();

  return { profile, tenant, error: tenantError };
}

export function getOnboardingErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.';

  const message = error.message ?? '';
  const detail = error.details ?? error.detail ?? '';

  if (message.includes('domain is already registered') || detail === 'domain_taken') {
    return 'This organization domain is already registered. Use a different domain or contact your administrator.';
  }
  if (detail === 'invalid_plan' || message.includes('Invalid subscription plan')) {
    return 'Please choose a valid subscription plan (Starter, Professional, or Enterprise).';
  }
  if (detail === 'missing_company' || message.includes('Company name is required')) {
    return 'Company name is required.';
  }
  if (detail === 'missing_domain' || message.includes('Primary domain is required')) {
    return 'Primary domain is required.';
  }
  if (error.code === '42P01') {
    return 'Workspace tables are not ready. Run supabase/multi-tenant-rbac.sql and supabase/workspace-onboarding.sql.';
  }
  if (
    message.includes('check_workspace_signup_available') ||
    message.includes('finalize_workspace_onboarding') ||
    message.includes('get_my_workspace_status')
  ) {
    return 'Workspace database functions are missing. Run supabase/workspace-onboarding.sql in the Supabase SQL editor, then try again.';
  }

  if (message.includes('function') && message.includes('does not exist')) {
    return 'Workspace database functions are missing. Run supabase/workspace-onboarding.sql in the Supabase SQL editor.';
  }

  return message || 'Unable to create workspace. Please try again.';
}

export function mapAvailabilityToMessage(result) {
  if (result?.available) return null;
  return result?.message || 'This workspace cannot be created with the provided details.';
}
