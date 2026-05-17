export const TICKET_STATUSES = [
  { value: 'open', label: 'Open', badge: 'red' },
  { value: 'in_progress', label: 'In Progress', badge: 'blue' },
  { value: 'pending', label: 'Pending', badge: 'yellow' },
  { value: 'resolved', label: 'Resolved', badge: 'green' },
];

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const TICKET_CATEGORIES = [
  'Password Reset',
  'Software Issue',
  'Hardware Issue',
  'Network Issue',
  'Other',
];

export function getStatusMeta(status) {
  return TICKET_STATUSES.find((s) => s.value === status) ?? TICKET_STATUSES[0];
}

export function getPriorityLabel(priority) {
  return TICKET_PRIORITIES.find((p) => p.value === priority)?.label ?? priority;
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
