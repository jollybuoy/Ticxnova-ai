import { supabase } from '../supabase';
import { getTicketTypeMeta } from './constants';
import { linkTicketDevices } from '../itsm/ticketDeviceService';

function getTicketPrefix(payload = {}) {
  return getTicketTypeMeta(payload.ticket_type).prefix;
}

export async function generateTicketNumber(payload) {
  const prefix = getTicketPrefix(payload);
  const { data } = await supabase
    .from('tickets')
    .select('ticket_number')
    .like('ticket_number', `${prefix}-%`)
    .limit(1000);

  const lastNumber = (data ?? []).reduce((max, ticket) => {
    const value = Number(ticket.ticket_number?.split('-')[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 1000);

  return `${prefix}-${lastNumber + 1}`;
}

export async function fetchTickets(userId, tenantId) {
  let query = supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  query = tenantId ? query.eq('tenant_id', tenantId) : query.eq('user_id', userId);

  const { data, error } = await query;

  return { data: data ?? [], error };
}

export async function fetchTicketById(userId, ticketId, tenantId) {
  let query = supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
  query = tenantId ? query.eq('tenant_id', tenantId) : query.eq('user_id', userId);

  const { data, error } = await query.single();

  return { data, error };
}

export async function fetchTicketComments(userId, ticketId) {
  const { data, error } = await supabase
    .from('ticket_comments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  return { data: data ?? [], error };
}

export async function fetchTicketActivity(ticketId) {
  const { data, error } = await supabase
    .from('ticket_activity')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}

export async function fetchOpenTicketCount(userId) {
  const { count, error } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'open');

  return { count: count ?? 0, error };
}

export async function createTicket(userId, payload) {
  const ticketNumber = await generateTicketNumber(payload);
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      user_id: userId,
      tenant_id: payload.tenant_id || undefined,
      ticket_number: ticketNumber,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      status: 'open',
      ticket_type: payload.ticket_type || 'incident',
      priority: payload.priority ?? 'medium',
      category: payload.category || null,
      requester_name: payload.requester_name?.trim() || null,
      requester_email: payload.requester_email?.trim() || null,
      department: payload.department || null,
      ai_summary: payload.ai_summary || null,
      ai_suggested_category: payload.ai_suggested_category || payload.category || null,
      ai_suggested_priority: payload.ai_suggested_priority || payload.priority || null,
      ai_reasoning: payload.ai_reasoning || null,
      ai_summary_generated_at: payload.ai_summary ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (data && !error) {
    await supabase.from('ticket_activity').insert({
      ticket_id: data.id,
      user_id: userId,
      type: 'system',
      message: 'created ticket',
      actor_name: payload.requester_name ?? 'AI Assistant',
      actor_email: payload.requester_email ?? null,
    });

    if (payload.device_ids?.length > 0) {
      await linkTicketDevices(userId, data.id, payload.device_ids, {
        name: payload.requester_name ?? 'System',
        email: payload.requester_email ?? null,
        tenantId: payload.tenant_id,
      });
    }
  }

  return { data, error };
}

export async function updateTicketStatus(userId, ticketId, status) {
  const { data, error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error };
}

function buildActivityMessage(field, previousValue, newValue) {
  const labels = {
    status: 'updated status',
    priority: 'updated priority',
    assignee_name: 'updated assignment',
    department: 'updated department',
  };

  return `${labels[field] ?? `updated ${field}`} from ${previousValue || 'None'} to ${
    newValue || 'None'
  }`;
}

async function createTicketActivity(ticketId, userId, activity) {
  const { data, error } = await supabase
    .from('ticket_activity')
    .insert({
      ticket_id: ticketId,
      ...activity,
    })
    .select()
    .single();

  return { data, error };
}

export async function updateTicketFields(userId, ticket, updates, actor) {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', ticket.id)
    .eq(ticket.tenant_id ? 'tenant_id' : 'user_id', ticket.tenant_id || userId)
    .select()
    .single();

  if (error) return { data: null, error };

  const activityEntries = Object.entries(updates)
    .filter(([field, value]) => String(ticket[field] ?? '') !== String(value ?? ''))
    .map(([field, value]) => ({
      type: field === 'status' ? 'status_change' : 'field_update',
      field,
      previous_value: ticket[field] ?? null,
      new_value: value ?? null,
      message: buildActivityMessage(field, ticket[field], value),
      actor_name: actor.name,
      actor_email: actor.email,
    }));

  if (activityEntries.length > 0) {
    await supabase.from('ticket_activity').insert(
      activityEntries.map((entry) => ({
        ticket_id: ticket.id,
        ...entry,
      })),
    );
  }

  return { data, error: null };
}

export async function addTicketComment(userId, ticketId, body, actor) {
  const { data, error } = await supabase
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      body: body.trim(),
      author_name: actor.name,
      author_email: actor.email,
    })
    .select()
    .single();

  if (error) return { data: null, error };

  await createTicketActivity(ticketId, userId, {
    type: 'comment',
    message: 'added a work note',
    actor_name: actor.name,
    actor_email: actor.email,
  });

  return { data, error: null };
}

export async function deleteTicket(userId, ticketId) {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId)
    .eq('user_id', userId);

  return { error };
}

export async function summarizeTicket(userId, ticket) {
  const { data, error } = await supabase.functions.invoke('summarize-ticket', {
    body: {
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
    },
  });

  if (error) {
    return { data: null, error };
  }

  const { data: updatedTicket, error: updateError } = await supabase
    .from('tickets')
    .update({
      ai_summary: data.summary,
      ai_suggested_category: data.category,
      ai_suggested_priority: data.priority,
      ai_reasoning: data.reasoning ?? null,
      ai_summary_generated_at: new Date().toISOString(),
    })
    .eq('id', ticket.id)
    .eq('user_id', userId)
    .select()
    .single();

  return {
    data: updatedTicket,
    error: updateError,
  };
}

export function getTicketErrorMessage(error) {
  if (!error) return 'Something went wrong.';
  if (error.code === '42P01') {
    return 'Tickets table not found. Run supabase/tickets.sql in your Supabase project.';
  }
  return error.message ?? 'Something went wrong.';
}
