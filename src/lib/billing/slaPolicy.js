export const DEFAULT_SLA_HOURS = {
  urgent: 4,
  high: 8,
  medium: 24,
  low: 48,
};

export function normalizeSlaHours(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    urgent: positiveHours(source.urgent, DEFAULT_SLA_HOURS.urgent),
    high: positiveHours(source.high, DEFAULT_SLA_HOURS.high),
    medium: positiveHours(source.medium, DEFAULT_SLA_HOURS.medium),
    low: positiveHours(source.low, DEFAULT_SLA_HOURS.low),
  };
}

function positiveHours(value, fallback) {
  const hours = Number(value);
  return Number.isFinite(hours) && hours > 0 ? hours : fallback;
}

export function slaHoursFromTenant(tenant) {
  return normalizeSlaHours(tenant?.sla_hours);
}
