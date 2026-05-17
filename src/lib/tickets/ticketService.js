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

export async function deleteTicket(userId, ticketId) {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId)
    .eq('user_id', userId);

  return { error };
}

export async function summarizeTicket(ticket) {
  const { data, error } = await supabase.functions.invoke('summarize-ticket', {
    body: {
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
    },
  });

  return { data, error };
}

export function getTicketErrorMessage(error) {
  if (!error) return 'Something went wrong.';
  if (error.code === '42P01') {
    return 'Tickets table not found. Run supabase/tickets.sql in your Supabase project.';
  }
  return error.message ?? 'Something went wrong.';
}
