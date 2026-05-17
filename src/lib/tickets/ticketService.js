import { supabase } from '../supabase';

export function generateTicketNumber() {
  const segment = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TK-${segment}`;
}

export async function fetchTickets(userId) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}

export async function fetchTicketById(userId, ticketId) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .eq('id', ticketId)
    .single();

  return { data, error };
}

export async function fetchTicketComments(userId, ticketId) {
  const { data, error } = await supabase
    .from('ticket_comments')
    .select('*')
    .eq('user_id', userId)
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
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      user_id: userId,
      ticket_number: generateTicketNumber(),
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      status: 'open',
      priority: payload.priority ?? 'medium',
      category: payload.category || null,
      requester_name: payload.requester_name?.trim() || null,
    })
    .select()
    .single();

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
      user_id: userId,
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
    .eq('user_id', userId)
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
        user_id: userId,
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
      user_id: userId,
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
