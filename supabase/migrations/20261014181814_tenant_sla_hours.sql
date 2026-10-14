alter table public.tenants
  add column if not exists sla_hours jsonb not null default jsonb_build_object(
    'urgent', 4,
    'high', 8,
    'medium', 24,
    'low', 48
  );

comment on column public.tenants.sla_hours is
  'Resolution SLA windows in hours by priority. Missing or invalid values fall back to 4/8/24/48.';
