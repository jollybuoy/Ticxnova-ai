-- Enterprise hardening: audit logs, subscription metadata, notification helpers.
-- Run after saas-maturity.sql

-- ---------------------------------------------------------------------------
-- Subscription metadata
-- ---------------------------------------------------------------------------
alter table public.tenants
  add column if not exists subscription_expires_at timestamptz;

comment on column public.tenants.subscription_expires_at is
  'Paid subscription period end (future Stripe sync). Trial end uses trial_ends_at.';

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  module text not null,
  action text not null,
  entity_type text,
  entity_id text,
  summary text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_tenant_idx on public.audit_logs (tenant_id, created_at desc);
create index if not exists audit_logs_module_idx on public.audit_logs (tenant_id, module, created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "Tenant admins read audit logs" on public.audit_logs;
create policy "Tenant admins read audit logs" on public.audit_logs
  for select using (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin', 'org_admin'])
  );

drop policy if exists "Tenant members insert audit logs" on public.audit_logs;
create policy "Tenant members insert audit logs" on public.audit_logs
  for insert with check (
    public.is_tenant_member(tenant_id)
    and (actor_id = auth.uid() or actor_id is null)
  );

-- ---------------------------------------------------------------------------
-- Mark expired trials (optional cron / manual)
-- ---------------------------------------------------------------------------
create or replace function public.sync_expired_trial_status()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.tenants t
  set subscription_status = 'expired'
  where t.subscription_status = 'trialing'
    and t.trial_ends_at is not null
    and t.trial_ends_at < now();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

grant execute on function public.sync_expired_trial_status() to authenticated;

-- Extend trial (platform admin / support)
create or replace function public.extend_tenant_trial(
  target_tenant_id uuid,
  extra_days integer default 7
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if extra_days < 1 or extra_days > 90 then
    raise exception 'extra_days must be between 1 and 90';
  end if;

  update public.tenants t
  set
    trial_ends_at = coalesce(t.trial_ends_at, t.created_at + interval '7 days') + (extra_days || ' days')::interval,
    subscription_status = 'trialing'
  where t.id = target_tenant_id;
end;
$$;

grant execute on function public.extend_tenant_trial(uuid, integer) to authenticated;
