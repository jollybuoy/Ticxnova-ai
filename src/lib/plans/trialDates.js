/** Free trial length from workspace (account) creation */
export const TRIAL_DAYS = 7;

const MS_PER_DAY = 86_400_000;

export function getTrialStartedAt(tenant) {
  if (!tenant) return null;
  if (tenant.trial_started_at) return new Date(tenant.trial_started_at);
  if (tenant.created_at) return new Date(tenant.created_at);
  return null;
}

/** Trial ends exactly TRIAL_DAYS after account/workspace created_at */
export function getTrialEndsAt(tenant) {
  if (!tenant) return null;
  if (tenant.trial_ends_at) return new Date(tenant.trial_ends_at);
  const started = getTrialStartedAt(tenant);
  if (!started) return null;
  return new Date(started.getTime() + TRIAL_DAYS * MS_PER_DAY);
}

export function getTrialDaysRemaining(tenant) {
  const endsAt = getTrialEndsAt(tenant);
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / MS_PER_DAY));
}
