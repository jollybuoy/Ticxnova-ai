-- SaaS maturity: trials, Stripe foundation, KB, notifications.
-- Run after domain-verification.sql

-- ---------------------------------------------------------------------------
-- Tenant billing & trial
-- ---------------------------------------------------------------------------
alter table public.tenants
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists subscription_status text not null default 'trialing',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists billing_email text;

alter table public.tenants
  drop constraint if exists tenants_subscription_status_check;

alter table public.tenants
  add constraint tenants_subscription_status_check
  check (subscription_status in ('trialing', 'active', 'expired', 'suspended', 'past_due'));

-- Backfill: trial window is always 7 days from account (workspace) created_at
update public.tenants
set
  subscription_status = case
    when subscription_status in ('trialing', 'active', 'expired', 'suspended', 'past_due') then subscription_status
    else 'active'
  end,
  trial_started_at = created_at,
  trial_ends_at = created_at + interval '7 days'
where trial_started_at is null
   or trial_ends_at is null
   or trial_started_at <> created_at
   or trial_ends_at <> created_at + interval '7 days';

-- Grandfather existing workspaces created before this migration (optional: keep active)
-- New signups after deploy use subscription_status = 'trialing' from provision_workspace.

-- New workspaces: start 7-day trial (patch provision_workspace)
create or replace function public.start_tenant_trial(target_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tenants t
  set
    trial_started_at = t.created_at,
    trial_ends_at = t.created_at + interval '7 days',
    subscription_status = 'trialing'
  where t.id = target_tenant_id;
end;
$$;

create or replace function public.provision_workspace(
  target_user_id uuid,
  target_email text,
  target_company_name text,
  target_domain text,
  target_plan text,
  target_full_name text default null,
  target_department text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  company_name text := trim(coalesce(target_company_name, ''));
  domain_name text := public.normalize_workspace_domain(target_domain);
  plan_name text := lower(trim(coalesce(target_plan, 'starter')));
  full_name text := nullif(trim(coalesce(target_full_name, '')), '');
  department_name text := nullif(trim(coalesce(target_department, '')), '');
  normalized_email text := lower(trim(coalesce(target_email, '')));
  new_tenant_id uuid;
  token_value text;
begin
  if target_user_id is null or normalized_email = '' then
    raise exception 'Authenticated user is required.'
      using errcode = 'check_violation', detail = 'missing_user';
  end if;

  if company_name = '' then
    raise exception 'Company name is required.'
      using errcode = 'check_violation', detail = 'missing_company';
  end if;

  if domain_name is null then
    raise exception 'Primary domain is required.'
      using errcode = 'check_violation', detail = 'missing_domain';
  end if;

  if public.is_valid_subscription_plan(plan_name) = false then
    raise exception 'Invalid subscription plan.'
      using errcode = 'check_violation', detail = 'invalid_plan';
  end if;

  if public.tenant_domain_is_reserved(domain_name) then
    raise exception 'This organization domain is already verified by another workspace.'
      using errcode = 'unique_violation', detail = 'domain_taken';
  end if;

  token_value := public.generate_domain_verification_token();

  insert into public.tenants (
    company_name,
    domain,
    subscription_plan,
    verification_status,
    domain_verified,
    verification_token,
    verification_requested_at,
    is_active,
    subscription_status,
    billing_email
  )
  values (
    company_name,
    domain_name,
    plan_name,
    'pending_domain_verification',
    false,
    token_value,
    now(),
    true,
    'trialing',
    normalized_email
  )
  returning id into new_tenant_id;

  -- 7-day trial from account creation (tenants.created_at), not domain verification
  update public.tenants t
  set
    trial_started_at = t.created_at,
    trial_ends_at = t.created_at + interval '7 days'
  where t.id = new_tenant_id;

  insert into public.profiles (id, tenant_id, email, full_name, role, department)
  values (
    target_user_id,
    new_tenant_id,
    normalized_email,
    full_name,
    'org_admin',
    department_name
  )
  on conflict (id) do update set
    tenant_id = excluded.tenant_id,
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = 'org_admin',
    department = coalesce(excluded.department, public.profiles.department);

  insert into public.tenant_users (tenant_id, user_id, email, full_name, role, department, joined_at)
  values (
    new_tenant_id,
    target_user_id,
    normalized_email,
    full_name,
    'org_admin',
    department_name,
    now()
  )
  on conflict (tenant_id, email) do update set
    user_id = excluded.user_id,
    full_name = coalesce(excluded.full_name, public.tenant_users.full_name),
    role = 'org_admin',
    department = excluded.department,
    is_active = true,
    joined_at = coalesce(public.tenant_users.joined_at, now());

  return new_tenant_id;
end;
$$;

create or replace function public.get_tenant_subscription_state(target_tenant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.tenants%rowtype;
  trial_start timestamptz;
  trial_end timestamptz;
  days_left integer;
  is_expired boolean;
  can_use_app boolean;
begin
  select * into t from public.tenants where id = target_tenant_id;
  if t.id is null then
    return jsonb_build_object('found', false);
  end if;

  trial_start := coalesce(t.trial_started_at, t.created_at);
  trial_end := coalesce(t.trial_ends_at, t.created_at + interval '7 days');

  if t.subscription_status = 'active' then
    is_expired := false;
  elsif t.subscription_status in ('expired', 'suspended') then
    is_expired := true;
  elsif trial_end < now() then
    is_expired := true;
  else
    is_expired := false;
  end if;

  days_left := greatest(0, ceil(extract(epoch from (trial_end - now())) / 86400.0)::integer);

  can_use_app := not is_expired
    and t.is_active = true
    and t.domain_verified = true
    and t.verification_status = 'verified';

  return jsonb_build_object(
    'found', true,
    'subscription_plan', t.subscription_plan,
    'subscription_status', t.subscription_status,
    'trial_started_at', trial_start,
    'trial_ends_at', trial_end,
    'account_created_at', t.created_at,
    'trial_days_remaining', days_left,
    'is_trial_expired', is_expired,
    'can_use_app', can_use_app,
    'is_read_only', is_expired,
    'stripe_customer_id', t.stripe_customer_id,
    'stripe_subscription_id', t.stripe_subscription_id
  );
end;
$$;

grant execute on function public.get_tenant_subscription_state(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Stripe foundation (webhook-ready)
-- ---------------------------------------------------------------------------
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete set null,
  stripe_event_id text unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists billing_events_tenant_idx on public.billing_events (tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Knowledge base
-- ---------------------------------------------------------------------------
create table if not exists public.kb_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  category_id uuid references public.kb_categories (id) on delete set null,
  title text not null,
  slug text not null,
  content text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  author_id uuid references auth.users (id) on delete set null,
  search_text text generated always as (title || ' ' || coalesce(content, '')) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists kb_articles_tenant_idx on public.kb_articles (tenant_id, status, updated_at desc);
create index if not exists kb_articles_search_idx on public.kb_articles using gin (to_tsvector('english', search_text));

alter table public.kb_categories enable row level security;
alter table public.kb_articles enable row level security;

drop policy if exists "Tenant members read kb categories" on public.kb_categories;
create policy "Tenant members read kb categories" on public.kb_categories
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists "Tenant admins manage kb categories" on public.kb_categories;
create policy "Tenant admins manage kb categories" on public.kb_categories
  for all using (public.has_tenant_role(array['super_admin', 'org_admin', 'technician']))
  with check (public.has_tenant_role(array['super_admin', 'org_admin', 'technician']) and public.is_tenant_member(tenant_id));

drop policy if exists "Tenant members read kb articles" on public.kb_articles;
create policy "Tenant members read kb articles" on public.kb_articles
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists "Tenant staff manage kb articles" on public.kb_articles;
create policy "Tenant staff manage kb articles" on public.kb_articles
  for all using (public.has_tenant_role(array['super_admin', 'org_admin', 'technician']))
  with check (public.has_tenant_role(array['super_admin', 'org_admin', 'technician']) and public.is_tenant_member(tenant_id));

-- ---------------------------------------------------------------------------
-- Notifications foundation
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, read_at, created_at desc);
create index if not exists notifications_tenant_idx on public.notifications (tenant_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select using (user_id = auth.uid() and public.is_tenant_member(tenant_id));

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "System insert notifications" on public.notifications;
create policy "System insert notifications" on public.notifications
  for insert with check (public.is_tenant_member(tenant_id));
