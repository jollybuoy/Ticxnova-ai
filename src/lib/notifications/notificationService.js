import { supabase } from '../supabase';

export const NOTIFICATION_TYPES = {
  TICKET_ASSIGNED: 'ticket_assigned',
  TICKET_UPDATED: 'ticket_updated',
  STATUS_CHANGED: 'status_changed',
  SLA_ALERT: 'sla_alert',
  COMMENT_ADDED: 'comment_added',
  TRIAL_EXPIRING: 'trial_expiring',
  DOMAIN_APPROVED: 'domain_approved',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
};

/**
 * Foundation for in-app notifications. Realtime can subscribe to
 * `notifications:user_id=eq.${userId}` when enabled in Supabase.
 */
export async function listNotifications({ limit = 30, unreadOnly = false } = {}) {
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function createNotification({
  tenantId,
  userId,
  type,
  title,
  body,
  metadata = {},
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      type,
      title,
      body,
      metadata,
    })
    .select()
    .single();

  return { data, error };
}

export async function markNotificationRead(notificationId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single();

  return { data, error };
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);

  return { error };
}

export function subscribeToNotifications(userId, onPayload) {
  if (!userId) return () => {};

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onPayload?.(payload.new),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
