import { getTicketSla } from './incidentModel';

export const OPEN_STATUSES = ['open', 'in_progress', 'pending'];

export function isOpenTicket(ticket) {
  return OPEN_STATUSES.includes(ticket.status);
}

export function isUnassigned(ticket) {
  return !ticket.assignee_name?.trim();
}

export function getOpenTickets(tickets = []) {
  return tickets.filter(isOpenTicket);
}

export function getSlaRiskTickets(tickets = [], now = Date.now()) {
  return getOpenTickets(tickets).filter((ticket) => {
    const sla = getTicketSla(ticket, now);
    return sla.atRisk || sla.breached;
  });
}

export function getUnassignedTickets(tickets = []) {
  return getOpenTickets(tickets).filter(isUnassigned);
}

export function getResolvedToday(tickets = [], now = Date.now()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return tickets.filter(
    (ticket) => ticket.status === 'resolved' && new Date(ticket.updated_at || ticket.created_at) >= start,
  );
}

export function initials(name = '') {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || 'U').slice(0, 2).toUpperCase();
}

export function greetingForHour(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(name = 'there') {
  return String(name).trim().split(/\s+/)[0] || 'there';
}

export function formatSlaClock(ticket, now = Date.now()) {
  const sla = getTicketSla(ticket, now);
  if (ticket.status === 'resolved') {
    return { text: sla.label === 'Met' ? 'Met' : 'Late', tone: sla.label === 'Met' ? 'green' : 'red', sla };
  }
  const created = new Date(ticket.created_at).getTime();
  const delta = sla.breached ? now - created - sla.totalMs : sla.remainingMs;
  const minutes = Math.max(0, Math.round(delta / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const text = `${sla.breached ? '-' : ''}${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
  const tone = sla.breached ? 'red' : sla.atRisk ? 'orange' : 'green';
  return { text, tone, sla };
}

export function sparklineCounts(tickets = [], days = 7, predicate = () => true, now = Date.now()) {
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (days - 1 - index));
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    return tickets.filter((ticket) => {
      const created = new Date(ticket.created_at).getTime();
      return created >= day.getTime() && created < next.getTime() && predicate(ticket);
    }).length;
  });
}

export function weekPriorityBars(tickets = [], now = Date.now()) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const scoped = tickets.filter((ticket) => {
      const created = new Date(ticket.created_at).getTime();
      return created >= day.getTime() && created < next.getTime();
    });
    return {
      name: day.toLocaleDateString(undefined, { weekday: 'short' }),
      critical: scoped.filter((ticket) => ticket.priority === 'urgent').length,
      high: scoped.filter((ticket) => ticket.priority === 'high').length,
      normal: scoped.filter((ticket) => !['urgent', 'high'].includes(ticket.priority)).length,
    };
  });
}

export function teamWorkload(tickets = []) {
  const open = getOpenTickets(tickets);
  const groups = new Map();
  open.forEach((ticket) => {
    const name = ticket.assignee_name?.trim() || 'Unassigned';
    groups.set(name, (groups.get(name) ?? 0) + 1);
  });
  const max = Math.max(1, ...groups.values());
  return [...groups.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => {
      const percent = Math.round((count / max) * 100);
      const load = percent >= 80 ? 'High' : percent >= 45 ? 'Medium' : 'Low';
      return { name, count, percent, load, avatar: initials(name) };
    });
}

export function exportTicketsCsv(tickets = []) {
  const header = ['ID', 'Subject', 'Requester', 'Priority', 'Status', 'Assignee', 'Updated'];
  const rows = tickets.map((ticket) => [
    ticket.ticket_number || ticket.id,
    ticket.title || '',
    ticket.requester_name || ticket.requester_email || '',
    ticket.priority || '',
    ticket.status || '',
    ticket.assignee_name || '',
    ticket.updated_at || ticket.created_at || '',
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ticxnova-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
