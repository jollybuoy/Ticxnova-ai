import { supabase } from '../supabase';

export async function fetchTicketDevices(ticketId) {
  const { data, error } = await supabase
    .from('ticket_devices')
    .select('id, relationship_type, created_at, devices(*)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  return {
    data: (data ?? []).map((link) => ({ ...link.devices, link_id: link.id, relationship_type: link.relationship_type })),
    error,
  };
}

export async function fetchDeviceTickets(deviceId) {
  const { data, error } = await supabase
    .from('ticket_devices')
    .select('id, relationship_type, created_at, tickets(*)')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });

  return {
    data: (data ?? []).map((link) => ({ ...link.tickets, link_id: link.id, relationship_type: link.relationship_type })),
    error,
  };
}

export async function fetchAssetIncidentLinks(userId) {
  const { data, error } = await supabase
    .from('ticket_devices')
    .select('device_id, ticket_id, created_at, devices(*), tickets(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}

export async function linkTicketDevices(userId, ticketId, deviceIds = [], actor = {}) {
  const uniqueIds = [...new Set(deviceIds.filter(Boolean))];
  if (uniqueIds.length === 0) return { data: [], error: null };

  const { data: existing, error: existingError } = await supabase
    .from('ticket_devices')
    .select('device_id')
    .eq('ticket_id', ticketId)
    .in('device_id', uniqueIds);

  if (existingError) return { data: [], error: existingError };

  const existingIds = new Set((existing ?? []).map((item) => item.device_id));
  const idsToInsert = uniqueIds.filter((deviceId) => !existingIds.has(deviceId));
  if (idsToInsert.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from('ticket_devices')
    .insert(
      idsToInsert.map((deviceId, index) => ({
        ticket_id: ticketId,
        device_id: deviceId,
        user_id: userId,
        relationship_type: index === 0 ? 'primary_asset' : 'affected_asset',
        created_by_name: actor.name,
        created_by_email: actor.email,
      })),
    )
    .select();

  return { data: data ?? [], error };
}

export async function unlinkTicketDevice(ticketId, deviceId) {
  const { error } = await supabase
    .from('ticket_devices')
    .delete()
    .eq('ticket_id', ticketId)
    .eq('device_id', deviceId);

  return { error };
}

export async function replaceTicketDevices(userId, ticketId, nextDeviceIds = [], actor = {}) {
  const { data: current, error: fetchError } = await supabase
    .from('ticket_devices')
    .select('device_id')
    .eq('ticket_id', ticketId);

  if (fetchError) return { error: fetchError };

  const currentIds = new Set((current ?? []).map((item) => item.device_id));
  const nextIds = new Set(nextDeviceIds.filter(Boolean));
  const toAdd = [...nextIds].filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

  if (toAdd.length > 0) {
    const { error } = await linkTicketDevices(userId, ticketId, toAdd, actor);
    if (error) return { error };
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('ticket_devices')
      .delete()
      .eq('ticket_id', ticketId)
      .in('device_id', toRemove);
    if (error) return { error };
  }

  return { error: null };
}

export function getTicketDeviceErrorMessage(error) {
  if (!error) return 'Something went wrong.';
  if (error.code === '42P01') {
    return 'Ticket-device relationship table not found. Run supabase/ticket-device-relationship.sql.';
  }
  return error.message ?? 'Something went wrong.';
}

export function buildAssetHealthInsight(device, relatedTickets = []) {
  const openTickets = relatedTickets.filter((ticket) => ['open', 'in_progress', 'pending'].includes(ticket.status));
  const urgentTickets = relatedTickets.filter((ticket) => ['high', 'urgent'].includes(ticket.priority));
  const repeatedFailures = relatedTickets.length >= 3;
  const replacementRecommended =
    repeatedFailures || device?.health_status === 'Critical' || (device?.health_status === 'Offline' && openTickets.length > 0);

  if (replacementRecommended) {
    return {
      tone: 'red',
      title: 'Replacement review recommended',
      summary:
        'This asset has a high-risk signal based on health status or recurring support history. Review warranty, repair cost and refresh eligibility.',
    };
  }

  if (openTickets.length > 0 || urgentTickets.length > 0 || device?.health_status === 'Warning') {
    return {
      tone: 'yellow',
      title: 'Monitor active incidents',
      summary:
        'This asset has active support activity or warning signals. Track resolution time and watch for repeat patterns.',
    };
  }

  return {
    tone: 'green',
    title: 'Asset posture looks stable',
    summary: 'No recurring failure pattern detected from the current ticket history.',
  };
}
