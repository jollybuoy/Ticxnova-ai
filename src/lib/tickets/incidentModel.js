export const INCIDENT_STEPS = [
  { id: 'open', label: 'New' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'pending', label: 'Pending' },
  { id: 'resolved', label: 'Resolved' },
];

export const SLA_WINDOWS_MS = {
  urgent: 4 * 60 * 60 * 1000,
  high: 8 * 60 * 60 * 1000,
  medium: 24 * 60 * 60 * 1000,
  low: 48 * 60 * 60 * 1000,
};

const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'];
const PUBLIC_PREFIX = '[[visibility:public]]\n';

export function getSlaWindowMs(priority) {
  return SLA_WINDOWS_MS[priority] ?? SLA_WINDOWS_MS.medium;
}

export function getTicketSla(ticket, now = Date.now()) {
  const totalMs = getSlaWindowMs(ticket?.priority);
  const created = ticket?.created_at ? new Date(ticket.created_at).getTime() : now;
  const elapsed = Math.max(0, now - created);
  const remainingMs = ticket?.status === 'resolved' ? totalMs : Math.max(0, totalMs - elapsed);
  const usedMs = ticket?.status === 'resolved' ? Math.min(elapsed, totalMs) : elapsed;
  const percent = Math.min(100, Math.round((usedMs / totalMs) * 100));
  const breached = ticket?.status !== 'resolved' && remainingMs === 0;
  const atRisk = ticket?.status !== 'resolved' && remainingMs > 0 && remainingMs <= totalMs * 0.25;

  let label = 'On track';
  if (ticket?.status === 'resolved') label = elapsed <= totalMs ? 'Met' : 'Breached';
  else if (breached) label = 'Breached';
  else if (atRisk) label = 'At risk';

  return { totalMs, remainingMs, percent, breached, atRisk, label };
}

export function formatRemaining(ms) {
  if (ms <= 0) return '0 MIN';
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} MIN`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}H ${rest}M` : `${hours}H`;
}

export function formatAge(iso, now = Date.now()) {
  if (!iso) return '—';
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function getStepIndex(status) {
  const index = INCIDENT_STEPS.findIndex((step) => step.id === status);
  return index >= 0 ? index : 0;
}

export function nextPriority(priority) {
  const index = PRIORITY_ORDER.indexOf(priority);
  if (index < 0) return 'high';
  return PRIORITY_ORDER[Math.min(PRIORITY_ORDER.length - 1, index + 1)];
}

export function canEscalate(priority) {
  return nextPriority(priority) !== priority;
}

export function getCommentVisibility(comment) {
  if (comment?.visibility === 'public' || comment?.visibility === 'internal') {
    return comment.visibility;
  }
  if (comment?.comment_type === 'requester_reply' || comment?.comment_type === 'public') {
    return 'public';
  }
  if (comment?.body?.startsWith(PUBLIC_PREFIX)) return 'public';
  return 'internal';
}

export function getCommentBody(comment) {
  const body = comment?.body || comment?.comment || '';
  return body.startsWith(PUBLIC_PREFIX) ? body.slice(PUBLIC_PREFIX.length) : body;
}

export function encodeCommentBody(body, visibility) {
  const trimmed = body.trim();
  return visibility === 'public' ? `${PUBLIC_PREFIX}${trimmed}` : trimmed;
}

export function getCopilotConfidence(ticket) {
  if (ticket?.ai_summary && ticket?.ai_reasoning) return 92;
  if (ticket?.ai_summary) return 74;
  return 0;
}

export function buildSuggestedActions(ticket, linkedDevices = []) {
  return [
    {
      id: 'start',
      label: 'Move this incident to In Progress',
      done: ticket.status !== 'open',
      action: ticket.status === 'open' ? 'start' : null,
    },
    {
      id: 'assign',
      label: ticket.assignee_name ? `Owned by ${ticket.assignee_name}` : 'Assign an owner',
      done: Boolean(ticket.assignee_name),
      action: ticket.assignee_name ? null : 'edit',
    },
    {
      id: 'assets',
      label: linkedDevices.length > 0 ? `${linkedDevices.length} asset${linkedDevices.length === 1 ? '' : 's'} linked` : 'Link affected devices',
      done: linkedDevices.length > 0,
      action: null,
    },
    {
      id: 'ai',
      label: ticket.ai_summary ? 'Refresh AI diagnostics' : 'Run AI diagnostics',
      done: Boolean(ticket.ai_summary),
      action: 'diagnose',
    },
    {
      id: 'reply',
      label: 'Draft an update for the requester',
      done: false,
      action: 'draft',
    },
  ];
}

export function buildRequesterDraft(ticket) {
  const name = ticket.requester_name?.split(' ')[0] || 'there';
  const summary = ticket.ai_summary
    ? ticket.ai_summary
    : `We are actively investigating “${ticket.title}”.`;
  const next =
    ticket.status === 'resolved'
      ? 'This incident is marked resolved. Please reply if the issue returns.'
      : 'We will follow up as soon as we have the next finding.';
  return `Hi ${name},\n\n${summary}\n\n${next}\n\n— Ticxnova Service Desk`;
}

export function getIncidentHealth(ticket, linkedDevices, sla) {
  const criticalAssets = linkedDevices.filter((device) =>
    ['Critical', 'Offline'].includes(device.health_status),
  ).length;

  let sentiment = 'Stable';
  let sentimentTone = 'green';
  if (ticket.priority === 'urgent' || sla.breached) {
    sentiment = 'Frustrated';
    sentimentTone = 'orange';
  } else if (ticket.priority === 'high' || sla.atRisk) {
    sentiment = 'Concerned';
    sentimentTone = 'yellow';
  }

  return {
    scope: `${Math.max(1, linkedDevices.length)} asset${linkedDevices.length === 1 ? '' : 's'}`,
    sentiment,
    sentimentTone,
    slaLabel: sla.label,
    slaTone: sla.breached ? 'red' : sla.atRisk ? 'orange' : 'green',
    changeRisk: ticket.ticket_type === 'change_request' || criticalAssets > 0 ? 'Elevated' : 'Low',
    changeTone: ticket.ticket_type === 'change_request' || criticalAssets > 0 ? 'orange' : 'green',
  };
}

export function isMajorIncidentCandidate(ticket, linkedDevices, sla) {
  return (
    ticket.priority === 'urgent' ||
    linkedDevices.length >= 3 ||
    (ticket.priority === 'high' && (sla.atRisk || sla.breached))
  );
}

export function buildTimeline(activity = [], comments = []) {
  const commentItems = comments.map((comment) => ({
    id: `comment-${comment.id}`,
    at: comment.created_at,
    kind: getCommentVisibility(comment) === 'public' ? 'reply' : 'note',
    title: getCommentVisibility(comment) === 'public' ? 'Replied to requester' : 'Internal note',
    body: getCommentBody(comment),
    actor: comment.author_name || 'User',
    email: comment.author_email,
  }));

  const activityItems = activity
    .filter((item) => item.type !== 'comment')
    .map((item) => ({
      id: `activity-${item.id}`,
      at: item.created_at,
      kind: item.type === 'status_change' ? 'status' : item.type === 'system' ? 'system' : 'update',
      title: item.message,
      body:
        item.field && !['status', 'description', 'title'].includes(item.field)
          ? `${item.previous_value || 'None'} → ${item.new_value || 'None'}`
          : null,
      actor: item.actor_name || 'System',
      email: item.actor_email,
    }));

  return [...commentItems, ...activityItems].sort((a, b) => new Date(b.at) - new Date(a.at));
}
