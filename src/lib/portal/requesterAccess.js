const REQUESTER_ROLES = new Set(['employee']);

const REQUESTER_ALLOWED_PREFIXES = [
  '/portal',
  '/tickets',
  '/knowledge-base',
  '/profile',
  '/verify-domain',
  '/trial-expired',
  '/first-login-reset',
];

export function isRequesterRole(role) {
  return REQUESTER_ROLES.has(String(role || '').toLowerCase());
}

export function isRequesterAllowedPath(pathname) {
  return REQUESTER_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function requesterHomePath() {
  return '/portal';
}

export function isOwnRequest(ticket, user) {
  if (!ticket || !user) return false;
  const email = String(user.email || '').toLowerCase();
  return ticket.user_id === user.id || String(ticket.requester_email || '').toLowerCase() === email;
}
