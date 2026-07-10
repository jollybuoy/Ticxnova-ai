-- Stripe billing foundation: subscriptions table + tenant sync helpers.
-- Run after saas-maturity.sql

-- ---------------------------------------------------------------------------
-- Subscriptions (one active Stripe subscription per tenant)
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null default 'starter'
    check (plan in ('starter', 'professional', 'enterprise')),
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'expired', 'suspended', 'past_due', 'canceled')),
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_tenant_idx on public.subscriptions (tenant_id);
create index if not exists subscriptions_stripe_customer_idx on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_stripe_sub_idx on public.subscriptions (stripe_subscription_id);

alter table public.subscriptions enable row level security;

drop policy if exists "Tenant members read subscriptions" on public.subscriptions;
create policy "Tenant members read subscriptions" on public.subscriptions
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists "Tenant admins read subscriptions" on public.subscriptions;
create policy "Tenant admins read subscriptions" on public.subscriptions
  for select using (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin', 'org_admin'])
  );

-- Writes are performed by service role (webhooks / edge functions) only.

create or replace function public.touch_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_subscriptions_updated_at();

-- Ensure tenant billing columns exist (idempotent with saas-maturity.sql)
alter table public.tenants
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists subscription_status text not null default 'trialing',
  add column if not exists subscription_plan text not null default 'starter',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists subscription_expires_at timestamptz;

-- Sync helper used by webhooks (service role)
create or replace function public.upsert_tenant_subscription_from_stripe(
  p_tenant_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_plan text,
  p_status text,
  p_trial_ends_at timestamptz default null,
  p_current_period_start timestamptz default null,
  p_current_period_end timestamptz default null,
  p_cancel_at_period_end boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_plan text := lower(coalesce(p_plan, 'starter'));
  normalized_status text := lower(coalesce(p_status, 'expired'));
begin
  if normalized_plan not in ('starter', 'professional', 'enterprise') then
    normalized_plan := 'starter';
  end if;

  if normalized_status not in ('trialing', 'active', 'expired', 'suspended', 'past_due', 'canceled') then
    normalized_status := 'expired';
  end if;

  insert into public.subscriptions (
    tenant_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    plan,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end,
    cancel_at_period_end
  )
  values (
    p_tenant_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    normalized_plan,
    normalized_status,
    p_trial_ends_at,
    p_current_period_start,
    p_current_period_end,
    coalesce(p_cancel_at_period_end, false)
  )
  on conflict (tenant_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_price_id = excluded.stripe_price_id,
    plan = excluded.plan,
    status = excluded.status,
    trial_ends_at = excluded.trial_ends_at,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    updated_at = now();

  update public.tenants t
  set
    stripe_customer_id = coalesce(p_stripe_customer_id, t.stripe_customer_id),
    stripe_subscription_id = p_stripe_subscription_id,
    stripe_price_id = p_stripe_price_id,
    subscription_plan = normalized_plan,
    subscription_status = case
      when normalized_status = 'canceled' then 'expired'
      else normalized_status
    end,
    subscription_expires_at = p_current_period_end,
    trial_ends_at = coalesce(p_trial_ends_at, t.trial_ends_at)
  where t.id = p_tenant_id;
end;
$$;

grant execute on function public.upsert_tenant_subscription_from_stripe(
  uuid, text, text, text, text, text, timestamptz, timestamptz, timestamptz, boolean
) to service_role;
