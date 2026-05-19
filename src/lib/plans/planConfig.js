export const PLANS = ['starter', 'professional', 'enterprise'];

export const PLAN_LABELS = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

/** Feature keys used across the app for gating */
export const FEATURES = {
  TICKETS: 'tickets',
  DEVICES: 'devices',
  BASIC_REPORTS: 'basic_reports',
  AI_SUMMARIES: 'ai_summaries',
  MICROSOFT_LOGIN: 'microsoft_login',
  SMTP_SETUP: 'smtp_setup',
  INVITE_USERS: 'invite_users',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  AUTOMATION: 'automation',
  MULTI_DOMAIN: 'multi_domain',
  SLA_ENGINE: 'sla_engine',
  KNOWLEDGE_BASE: 'knowledge_base',
  NOTIFICATIONS: 'notifications',
  ADVANCED_RBAC: 'advanced_rbac',
  AUDIT_LOGS: 'audit_logs',
  GRAPH_SYNC: 'graph_sync',
  ENTERPRISE_ANALYTICS: 'enterprise_analytics',
};

const STARTER = new Set([
  FEATURES.TICKETS,
  FEATURES.DEVICES,
  FEATURES.BASIC_REPORTS,
  FEATURES.AI_SUMMARIES,
]);

const PROFESSIONAL = new Set([
  ...STARTER,
  FEATURES.KNOWLEDGE_BASE,
  FEATURES.SMTP_SETUP,
  FEATURES.INVITE_USERS,
  FEATURES.MICROSOFT_LOGIN,
  FEATURES.ADVANCED_ANALYTICS,
  FEATURES.NOTIFICATIONS,
]);

const ENTERPRISE = new Set([
  ...PROFESSIONAL,
  FEATURES.MULTI_DOMAIN,
  FEATURES.AUTOMATION,
  FEATURES.ADVANCED_RBAC,
  FEATURES.SLA_ENGINE,
  FEATURES.AUDIT_LOGS,
  FEATURES.GRAPH_SYNC,
  FEATURES.ENTERPRISE_ANALYTICS,
]);

export const PLAN_FEATURES = {
  starter: STARTER,
  professional: PROFESSIONAL,
  enterprise: ENTERPRISE,
};

export const FEATURE_MIN_PLAN = PLANS.reduce((acc, plan) => {
  for (const feature of PLAN_FEATURES[plan]) {
    if (!acc[feature]) acc[feature] = plan;
  }
  return acc;
}, {});

export const ROUTE_FEATURES = {
  '/knowledge-base': FEATURES.KNOWLEDGE_BASE,
  '/reports/tickets': FEATURES.ADVANCED_ANALYTICS,
  '/reports/devices': FEATURES.ADVANCED_ANALYTICS,
  '/reports/ai-insights': FEATURES.ADVANCED_ANALYTICS,
  '/reports/sla': FEATURES.SLA_ENGINE,
  '/settings/users': FEATURES.INVITE_USERS,
  '/settings/audit': FEATURES.AUDIT_LOGS,
  '/ai-assistant': FEATURES.AI_SUMMARIES,
};
