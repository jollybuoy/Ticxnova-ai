import { getTrialState } from './planAccess';
import { canAccessModule, MODULES } from '../rbac/modulePermissions';
import { canPerformAction } from '../rbac/actionPermissions';

/** Paths fully blocked when workspace is in read-only (expired trial). */
export const READ_ONLY_BLOCKED_PREFIXES = [
  '/ai-assistant',
  '/settings/users',
  '/knowledge-base',
];

/** Paths always reachable in read-only (view + billing). */
export const READ_ONLY_ALLOWED_PREFIXES = [
  '/dashboard',
  '/tickets',
  '/devices',
  '/assets',
  '/reports',
  '/profile',
  '/settings/billing',
  '/settings/organization',
  '/trial-expired',
];

export const TRIAL_EXEMPT_PATHS = new Set(['/trial-expired', '/settings/billing']);

export function isTrialExemptPath(pathname) {
  return TRIAL_EXEMPT_PATHS.has(pathname);
}

export function isPathBlockedInReadOnly(pathname) {
  return READ_ONLY_BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPathAllowedInReadOnly(pathname) {
  if (isPathBlockedInReadOnly(pathname)) return false;
  return READ_ONLY_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function canPerformWrite(tenant, role, module, action = 'create') {
  if (!tenant || !role) return false;
  const trial = getTrialState(tenant);
  if (trial.isReadOnly) return false;
  if (!canAccessModule(role, module, action === 'read' ? 'read' : 'create')) return false;
  return canPerformAction(role, module, action);
}

export function canUseModuleWrite(tenant, role, module) {
  return canPerformWrite(tenant, role, module, 'create');
}

export const WRITE_MODULES = {
  TICKETS: MODULES.TICKETS,
  DEVICES: MODULES.DEVICES,
  KB: MODULES.KB,
  AI: MODULES.AI,
  USERS: MODULES.USERS,
};
