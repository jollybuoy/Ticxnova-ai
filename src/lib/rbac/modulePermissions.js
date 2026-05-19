import { FEATURES } from '../plans/planConfig';

export const MODULES = {
  DASHBOARD: 'dashboard',
  TICKETS: 'tickets',
  DEVICES: 'devices',
  REPORTS: 'reports',
  KB: 'knowledge_base',
  AI: 'ai_assistant',
  USERS: 'users',
  ORGANIZATION: 'organization',
  BILLING: 'billing',
  ROLES: 'roles',
};

const ROLE_PERMISSIONS = {
  super_admin: {
    [MODULES.DASHBOARD]: 'manage',
    [MODULES.TICKETS]: 'manage',
    [MODULES.DEVICES]: 'manage',
    [MODULES.REPORTS]: 'manage',
    [MODULES.KB]: 'manage',
    [MODULES.AI]: 'manage',
    [MODULES.USERS]: 'manage',
    [MODULES.ORGANIZATION]: 'manage',
    [MODULES.BILLING]: 'manage',
    [MODULES.ROLES]: 'manage',
  },
  org_admin: {
    [MODULES.DASHBOARD]: 'read',
    [MODULES.TICKETS]: 'manage',
    [MODULES.DEVICES]: 'manage',
    [MODULES.REPORTS]: 'manage',
    [MODULES.KB]: 'manage',
    [MODULES.AI]: 'manage',
    [MODULES.USERS]: 'manage',
    [MODULES.ORGANIZATION]: 'manage',
    [MODULES.BILLING]: 'manage',
    [MODULES.ROLES]: 'manage',
  },
  technician: {
    [MODULES.DASHBOARD]: 'read',
    [MODULES.TICKETS]: 'manage',
    [MODULES.DEVICES]: 'manage',
    [MODULES.REPORTS]: 'read',
    [MODULES.KB]: 'manage',
    [MODULES.AI]: 'read',
    [MODULES.USERS]: 'read',
    [MODULES.ORGANIZATION]: 'read',
    [MODULES.BILLING]: 'none',
    [MODULES.ROLES]: 'read',
  },
  employee: {
    [MODULES.DASHBOARD]: 'read',
    [MODULES.TICKETS]: 'create',
    [MODULES.DEVICES]: 'read',
    [MODULES.REPORTS]: 'read',
    [MODULES.KB]: 'read',
    [MODULES.AI]: 'read',
    [MODULES.USERS]: 'none',
    [MODULES.ORGANIZATION]: 'read',
    [MODULES.BILLING]: 'none',
    [MODULES.ROLES]: 'none',
  },
  read_only: {
    [MODULES.DASHBOARD]: 'read',
    [MODULES.TICKETS]: 'read',
    [MODULES.DEVICES]: 'read',
    [MODULES.REPORTS]: 'read',
    [MODULES.KB]: 'read',
    [MODULES.AI]: 'read',
    [MODULES.USERS]: 'none',
    [MODULES.ORGANIZATION]: 'read',
    [MODULES.BILLING]: 'none',
    [MODULES.ROLES]: 'read',
  },
};

const LEVEL_RANK = { none: 0, read: 1, create: 2, manage: 3 };

export function getModulePermission(role, module) {
  const permissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.employee;
  return permissions[module] ?? 'none';
}

export function canAccessModule(role, module, required = 'read') {
  const level = getModulePermission(role, module);
  return (LEVEL_RANK[level] ?? 0) >= (LEVEL_RANK[required] ?? 1);
}

export function canManageModule(role, module) {
  return canAccessModule(role, module, 'manage');
}

/** Map nav/settings routes to module + optional plan feature */
export const ROUTE_GUARDS = {
  '/settings/users': { module: MODULES.USERS, feature: FEATURES.INVITE_USERS, roles: ['super_admin', 'org_admin'] },
  '/settings/organization': { module: MODULES.ORGANIZATION, roles: ['super_admin', 'org_admin'] },
  '/settings/roles': { module: MODULES.ROLES, roles: ['super_admin', 'org_admin'] },
  '/settings/billing': { module: MODULES.BILLING, roles: ['super_admin', 'org_admin'] },
  '/settings/audit': { module: MODULES.ORGANIZATION, feature: FEATURES.AUDIT_LOGS, roles: ['super_admin', 'org_admin'] },
  '/knowledge-base': { module: MODULES.KB, feature: FEATURES.KNOWLEDGE_BASE },
  '/reports/sla': { module: MODULES.REPORTS, feature: FEATURES.SLA_ENGINE },
  '/ai-assistant': { module: MODULES.AI, roles: ['super_admin', 'org_admin', 'technician', 'employee', 'read_only'] },
  '/tickets': { module: MODULES.TICKETS, roles: ['super_admin', 'org_admin', 'technician', 'employee', 'read_only'] },
  '/devices': { module: MODULES.DEVICES, roles: ['super_admin', 'org_admin', 'technician', 'employee', 'read_only'] },
};
