import { supabase } from '../supabase';

async function invokePlatformAdmin(payload) {
  const { data, error } = await supabase.functions.invoke('platform-admin', { body: payload });

  if (error) {
    return { data: null, error };
  }

  if (data?.error) {
    return { data: null, error: new Error(data.error) };
  }

  return { data, error: null };
}

export async function checkIsPlatformAdmin() {
  const { data, error } = await supabase.rpc('is_platform_admin');
  return { isAdmin: Boolean(data), error };
}

export async function touchPlatformAdminLogin() {
  const { error } = await supabase.rpc('touch_platform_admin_login');
  return { error };
}

export async function fetchPlatformDashboard() {
  return invokePlatformAdmin({ action: 'get_dashboard' });
}

export async function fetchPlatformWorkspaces() {
  return invokePlatformAdmin({ action: 'list_workspaces' });
}

export async function fetchPlatformUsers(search = '') {
  return invokePlatformAdmin({ action: 'list_users', search });
}

export async function setWorkspaceStatus(tenantId, isActive) {
  return invokePlatformAdmin({
    action: 'set_workspace_status',
    tenantId,
    isActive,
  });
}

export async function setPlatformUserStatus(userId, isActive) {
  return invokePlatformAdmin({
    action: 'set_user_status',
    userId,
    isActive,
  });
}

export async function deletePlatformWorkspace(tenantId) {
  return invokePlatformAdmin({
    action: 'delete_workspace',
    tenantId,
  });
}

export function formatPlatformError(error) {
  if (!error) return 'Something went wrong.';
  const message = error.message ?? '';
  if (message.includes('Platform super admin')) {
    return 'This account is not authorized for the Ticxnova platform admin portal.';
  }
  if (message.includes('Forbidden') || message.includes('403')) {
    return 'Platform super admin access required.';
  }
  return message || 'Unable to complete platform admin request.';
}
