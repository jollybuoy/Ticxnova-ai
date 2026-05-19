import { MODULES, canAccessModule, getModulePermission } from './modulePermissions';

export const ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
};

/**
 * Fine-grained action rules per module.
 * Falls back to module permission levels when action is not listed.
 */
const MODULE_ACTION_RULES = {
  [MODULES.TICKETS]: {
    [ACTIONS.DELETE]: ['super_admin', 'org_admin', 'technician'],
    [ACTIONS.CREATE]: ['super_admin', 'org_admin', 'technician', 'employee'],
    [ACTIONS.UPDATE]: ['super_admin', 'org_admin', 'technician'],
  },
  [MODULES.DEVICES]: {
    [ACTIONS.DELETE]: ['super_admin', 'org_admin'],
    [ACTIONS.CREATE]: ['super_admin', 'org_admin', 'technician'],
    [ACTIONS.UPDATE]: ['super_admin', 'org_admin', 'technician'],
  },
  [MODULES.KB]: {
    [ACTIONS.DELETE]: ['super_admin', 'org_admin', 'technician'],
    [ACTIONS.CREATE]: ['super_admin', 'org_admin', 'technician'],
    [ACTIONS.UPDATE]: ['super_admin', 'org_admin', 'technician'],
  },
  [MODULES.AI]: {
    [ACTIONS.CREATE]: ['super_admin', 'org_admin', 'technician'],
    [ACTIONS.UPDATE]: ['super_admin', 'org_admin', 'technician'],
  },
  [MODULES.USERS]: {
    [ACTIONS.CREATE]: ['super_admin', 'org_admin'],
    [ACTIONS.DELETE]: ['super_admin', 'org_admin'],
    [ACTIONS.UPDATE]: ['super_admin', 'org_admin'],
  },
  [MODULES.BILLING]: {
    [ACTIONS.READ]: ['super_admin', 'org_admin'],
    [ACTIONS.UPDATE]: ['super_admin', 'org_admin'],
  },
  [MODULES.ORGANIZATION]: {
    [ACTIONS.UPDATE]: ['super_admin', 'org_admin'],
  },
  [MODULES.ROLES]: {
    [ACTIONS.UPDATE]: ['super_admin', 'org_admin'],
  },
};

const ACTION_REQUIRED_LEVEL = {
  [ACTIONS.READ]: 'read',
  [ACTIONS.CREATE]: 'create',
  [ACTIONS.UPDATE]: 'manage',
  [ACTIONS.DELETE]: 'manage',
  [ACTIONS.MANAGE]: 'manage',
};

export function canPerformAction(role, module, action) {
  const normalizedRole = role || 'employee';
  const rules = MODULE_ACTION_RULES[module]?.[action];
  if (rules) {
    return rules.includes(normalizedRole);
  }
  const required = ACTION_REQUIRED_LEVEL[action] ?? 'read';
  return canAccessModule(normalizedRole, module, required);
}

export function getActionDenialReason(role, module, action) {
  if (canPerformAction(role, module, action)) return null;
  const level = getModulePermission(role, module);
  if (level === 'none') return 'Your role cannot access this module.';
  return 'You do not have permission for this action.';
}

export { MODULES };
