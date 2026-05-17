/**
 * Display helpers for Supabase user objects.
 */
export function getUserDisplayName(user) {
  if (!user) return 'User';
  const meta = user.user_metadata ?? {};
  if (meta.full_name) return meta.full_name;
  if (meta.name) return meta.name;
  if (user.email) return user.email.split('@')[0];
  return 'User';
}

export function getUserInitials(user) {
  const name = getUserDisplayName(user);
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getUserEmail(user) {
  return user?.email ?? '';
}
