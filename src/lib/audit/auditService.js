import { supabase } from '../supabase';

export const AUDIT_MODULES = {
  TICKETS: 'tickets',
  DEVICES: 'devices',
  KB: 'knowledge_base',
  USERS: 'users',
  ROLES: 'roles',
  BILLING: 'billing',
  TENANT: 'tenant',
  DOMAIN: 'domain',
};

export const AUDIT_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  STATUS_CHANGED: 'status_changed',
  COMMENT_ADDED: 'comment_added',
  INVITED: 'invited',
  PLAN_CHANGED: 'plan_changed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export async function recordAuditLog({
  tenantId,
  actorId,
  actorEmail,
  module,
  action,
  entityType,
  entityId,
  summary,
  oldValue,
  newValue,
  metadata = {},
}) {
  if (!tenantId || !module || !action) {
    return { data: null, error: new Error('tenantId, module, and action are required') };
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      tenant_id: tenantId,
      actor_id: actorId ?? null,
      actor_email: actorEmail ?? null,
      module,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ? String(entityId) : null,
      summary: summary ?? null,
      old_value: oldValue ?? null,
      new_value: newValue ?? null,
      metadata,
    })
    .select()
    .single();

  return { data, error };
}

export async function listAuditLogs({
  tenantId,
  module,
  search,
  limit = 50,
  offset = 0,
} = {}) {
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (module && module !== 'all') {
    query = query.eq('module', module);
  }

  if (search?.trim()) {
    query = query.ilike('summary', `%${search.trim()}%`);
  }

  const { data, error, count } = await query;
  return { data: data ?? [], error, count: count ?? 0 };
}
