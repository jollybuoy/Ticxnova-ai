import { supabase } from '../supabase';

export async function notifyTicketEvent({ ticketId, event, message }) {
  if (!ticketId || !event) return { skipped: true };
  const { error } = await supabase.functions.invoke('notify-ticket', {
    body: { ticketId, event, message },
  });
  return { error };
}

export async function saveOrganizationMail({ tenantId, config, secret }) {
  return supabase.functions.invoke('tenant-mail', {
    body: { action: 'save', tenantId, config, secret },
  });
}

export async function testOrganizationMail({ tenantId, config, secret, to }) {
  return supabase.functions.invoke('tenant-mail', {
    body: { action: 'test', tenantId, config, secret, to },
  });
}
