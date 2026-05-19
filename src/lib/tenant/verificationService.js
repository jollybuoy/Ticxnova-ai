import { supabase } from '../supabase';
import { canAccessApp } from '../plans/planAccess';

const TENANT_VERIFICATION_FIELDS =
  'id, company_name, domain, subscription_plan, created_at, is_active, verification_status, domain_verified, verification_method, rejected_reason';

export function workspaceCanAccessApp(tenant) {
  return canAccessApp(tenant);
}

export async function fetchMyDomainVerification() {
  const { data, error } = await supabase.rpc('get_my_domain_verification');
  if (error) {
    return { data: null, error };
  }
  return { data, error: null };
}

export async function invokeDomainVerification(action, extra = {}) {
  const { data, error } = await supabase.functions.invoke('domain-verification', {
    body: { action, ...extra },
  });

  if (error) {
    return { data: null, error };
  }

  if (data?.error) {
    return { data: null, error: new Error(data.error) };
  }

  return { data, error: null };
}

export async function verifyDomainDns() {
  return invokeDomainVerification('verify_dns');
}

export async function verifyDomainBusinessEmail() {
  return invokeDomainVerification('verify_business_email');
}

export async function requestDomainReview() {
  return invokeDomainVerification('request_review');
}

export function getVerificationStatusLabel(status) {
  const map = {
    pending_domain_verification: 'Pending domain verification',
    under_review: 'Under platform review',
    verified: 'Verified',
    rejected: 'Rejected',
  };
  return map[status] ?? 'Unknown';
}

export function tenantSelectFields() {
  return TENANT_VERIFICATION_FIELDS;
}
