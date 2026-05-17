export const TICKET_STATUSES = [
  { value: 'open', label: 'Open', badge: 'red' },
  { value: 'in_progress', label: 'In Progress', badge: 'blue' },
  { value: 'pending', label: 'Pending', badge: 'yellow' },
  { value: 'resolved', label: 'Resolved', badge: 'green' },
];

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low', badge: 'slate' },
  { value: 'medium', label: 'Medium', badge: 'blue' },
  { value: 'high', label: 'High', badge: 'yellow' },
  { value: 'urgent', label: 'Urgent', badge: 'red' },
];

export const TICKET_TYPES = [
  { value: 'incident', label: 'Incident', prefix: 'INC' },
  { value: 'service_request', label: 'Service Request', prefix: 'SR' },
  { value: 'problem', label: 'Problem', prefix: 'PRB' },
  { value: 'change_request', label: 'Change Request', prefix: 'CHG' },
];

export const TICKET_CATEGORIES = [
  'Password Reset',
  'Software Issue',
  'Hardware Issue',
  'Device Request',
  'Network Issue',
  'Other',
];

export function getTicketTypeForCategory(category, fallback = 'incident') {
  if (category === 'Device Request') return 'service_request';
  return fallback;
}

export function getStatusMeta(status) {
  return TICKET_STATUSES.find((s) => s.value === status) ?? TICKET_STATUSES[0];
}

export function getPriorityLabel(priority) {
  return TICKET_PRIORITIES.find((p) => p.value === priority)?.label ?? priority;
}

export function getPriorityMeta(priority) {
  return TICKET_PRIORITIES.find((p) => p.value === priority) ?? TICKET_PRIORITIES[1];
}

export function getTicketTypeMeta(type) {
  return TICKET_TYPES.find((item) => item.value === type) ?? TICKET_TYPES[0];
}

export function getTicketCounts(tickets) {
  return TICKET_STATUSES.reduce(
    (counts, status) => ({
      ...counts,
      [status.value]: tickets.filter((ticket) => ticket.status === status.value).length,
    }),
    { all: tickets.length },
  );
}

export function formatTicketDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}
