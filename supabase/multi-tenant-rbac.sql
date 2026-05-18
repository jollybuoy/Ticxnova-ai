-- Ticxnova-AI foundational multi-tenant and RBAC architecture.
-- Run after the existing tickets/devices schema scripts.

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  domain text,
  subscription_plan text not null default 'starter',
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete set null,
  email text not null,
  full_name text,
  role text not null default 'org_admin'
    check (role in ('super_admin', 'org_admin', 'technician', 'employee', 'read_only')),
  department text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'employee'
    check (role in ('super_admin', 'org_admin', 'technician', 'employee', 'read_only')),
  department text,
  is_active boolean not null default true,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);

alter table public.tenant_users
  add column if not exists full_name text;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  name text not null,
  description text,
  permissions jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

alter table public.tenants
  add column if not exists logo_url text,
  add column if not exists brand_color text default '#7c3aed';

alter table public.profiles
  add column if not exists must_reset_password boolean not null default false,
  add column if not exists password_reset_at timestamptz;

create index if not exists tenants_domain_idx on public.tenants (lower(domain));
create index if not exists profiles_tenant_idx on public.profiles (tenant_id);
create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists tenant_users_tenant_idx on public.tenant_users (tenant_id);
create index if not exists tenant_users_user_idx on public.tenant_users (user_id);
create index if not exists roles_tenant_idx on public.roles (tenant_id);

create or replace function public.email_domain(email text)
returns text
language sql
immutable
as $$
  select nullif(split_part(lower(email), '@', 2), '')
$$;

create table if not exists public.blocked_invite_domains (
  domain text primary key,
  reason text not null default 'Public email provider',
  created_at timestamptz not null default now()
);

create index if not exists blocked_invite_domains_domain_idx on public.blocked_invite_domains (domain);

insert into public.blocked_invite_domains (domain, reason)
values
  ('gmail.com', 'Public email provider'),
  ('googlemail.com', 'Public email provider'),
  ('outlook.com', 'Public email provider'),
  ('hotmail.com', 'Public email provider'),
  ('live.com', 'Public email provider'),
  ('msn.com', 'Public email provider'),
  ('yahoo.com', 'Public email provider'),
  ('icloud.com', 'Public email provider'),
  ('me.com', 'Public email provider'),
  ('aol.com', 'Public email provider'),
  ('proton.me', 'Public email provider'),
  ('protonmail.com', 'Public email provider')
on conflict (domain) do nothing;

create or replace function public.is_blocked_invite_domain(target_domain text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocked_invite_domains
    where domain = lower(target_domain)
  )
$$;

create or replace function public.is_tenant_invite_email_allowed(
  target_tenant_id uuid,
  target_email text,
  target_role text default 'employee'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    -- Admin accounts may use any login email; regular users must use the tenant domain.
    when target_role in ('super_admin', 'org_admin') then true
    else exists (
      select 1
      from public.tenants t
      where t.id = target_tenant_id
        and t.domain is not null
        and public.email_domain(target_email) = lower(t.domain)
        and public.is_blocked_invite_domain(public.email_domain(target_email)) = false
    )
  end
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_tenant_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.has_tenant_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_tenant_role() = any(allowed_roles), false)
$$;

create or replace function public.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_tenant_id is not null
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and tenant_id = target_tenant_id
    )
$$;

create or replace function public.ensure_user_tenant(
  target_user_id uuid,
  target_email text,
  target_full_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  domain_name text;
  tenant_record public.tenants%rowtype;
  new_tenant_id uuid;
begin
  domain_name := public.email_domain(target_email);

  select * into tenant_record
  from public.tenants
  where lower(domain) = domain_name
    and is_active = true
  order by created_at asc
  limit 1;

  if tenant_record.id is null then
    insert into public.tenants (company_name, domain, subscription_plan)
    values (
      coalesce(nullif(initcap(split_part(target_email, '@', 1)), ''), 'New Organization'),
      domain_name,
      'starter'
    )
    returning id into new_tenant_id;
  else
    new_tenant_id := tenant_record.id;
  end if;

  insert into public.profiles (id, tenant_id, email, full_name, role)
  values (target_user_id, new_tenant_id, lower(target_email), target_full_name, 'org_admin')
  on conflict (id) do update set
    tenant_id = coalesce(public.profiles.tenant_id, excluded.tenant_id),
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  insert into public.tenant_users (tenant_id, user_id, email, full_name, role, joined_at)
  values (new_tenant_id, target_user_id, lower(target_email), target_full_name, 'org_admin', now())
  on conflict (tenant_id, email) do update set
    user_id = excluded.user_id,
    full_name = coalesce(public.tenant_users.full_name, excluded.full_name),
    is_active = true,
    joined_at = coalesce(public.tenant_users.joined_at, now());

  return new_tenant_id;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_tenant_id uuid;
  metadata_role text;
  metadata_department text;
begin
  metadata_tenant_id := nullif(new.raw_user_meta_data->>'tenant_id', '')::uuid;
  metadata_role := coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'employee');
  metadata_department := nullif(new.raw_user_meta_data->>'department', '');

  if metadata_tenant_id is not null then
    insert into public.profiles (id, tenant_id, email, full_name, role, department)
    values (
      new.id,
      metadata_tenant_id,
      lower(new.email),
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      metadata_role,
      metadata_department
    )
    on conflict (id) do update set
      tenant_id = excluded.tenant_id,
      email = excluded.email,
      role = excluded.role,
      department = excluded.department;

    insert into public.tenant_users (tenant_id, user_id, email, full_name, role, department, joined_at)
    values (
      metadata_tenant_id,
      new.id,
      lower(new.email),
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      metadata_role,
      metadata_department,
      now()
    )
    on conflict (tenant_id, email) do update set
      user_id = excluded.user_id,
      full_name = excluded.full_name,
      role = excluded.role,
      department = excluded.department,
      is_active = true,
      joined_at = coalesce(public.tenant_users.joined_at, now());

    return new;
  end if;

  perform public.ensure_user_tenant(
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

create or replace function public.enforce_tenant_user_invite_domain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null
    and new.joined_at is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = new.user_id
        and p.tenant_id = new.tenant_id
    ) then
    return new;
  end if;

  if public.is_tenant_invite_email_allowed(new.tenant_id, new.email, new.role) = false then
    raise exception 'Invited users must use the organization domain and cannot use public email domains.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_tenant on auth.users;
create trigger on_auth_user_created_tenant
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

drop trigger if exists enforce_tenant_user_invite_domain on public.tenant_users;
create trigger enforce_tenant_user_invite_domain
  before insert or update of email, tenant_id, role on public.tenant_users
  for each row execute function public.enforce_tenant_user_invite_domain();

insert into public.roles (tenant_id, name, description, permissions, is_system)
values
  (null, 'super_admin', 'Platform owner with cross-tenant administration.', '{"all": true}'::jsonb, true),
  (null, 'org_admin', 'Organization administrator with full tenant administration.', '{"tickets": "manage", "devices": "manage", "users": "manage", "reports": "manage"}'::jsonb, true),
  (null, 'technician', 'Technician with operational ticket and device permissions.', '{"tickets": "manage", "devices": "manage", "reports": "read"}'::jsonb, true),
  (null, 'employee', 'Employee requester with self-service access.', '{"tickets": "create", "devices": "read"}'::jsonb, true),
  (null, 'read_only', 'Read-only auditor access.', '{"tickets": "read", "devices": "read", "reports": "read"}'::jsonb, true)
on conflict (tenant_id, name) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tenant-branding', 'tenant-branding', true, 5242880, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Tenant members read branding assets" on storage.objects;
create policy "Tenant members read branding assets" on storage.objects
  for select using (bucket_id = 'tenant-branding');

drop policy if exists "Org admins manage branding assets" on storage.objects;
create policy "Org admins manage branding assets" on storage.objects
  for all using (
    bucket_id = 'tenant-branding'
    and public.has_tenant_role(array['super_admin','org_admin'])
    and split_part(name, '/', 1) = public.current_tenant_id()::text
  )
  with check (
    bucket_id = 'tenant-branding'
    and public.has_tenant_role(array['super_admin','org_admin'])
    and split_part(name, '/', 1) = public.current_tenant_id()::text
  );

-- Tenant-aware columns for existing and future operational tables.
alter table public.tickets add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
alter table public.tickets add column if not exists requester_email text;
alter table public.devices add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
alter table public.ticket_comments add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
alter table public.ticket_activity add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
alter table public.device_notes add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
alter table public.device_activity add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
alter table public.ticket_devices add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;

-- Future KB table compatibility if/when the table exists.
do $$
begin
  if to_regclass('public.knowledge_articles') is not null then
    alter table public.knowledge_articles add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
  end if;
end $$;

update public.tickets t
set tenant_id = p.tenant_id
from public.profiles p
where t.tenant_id is null and t.user_id = p.id;

update public.devices d
set tenant_id = p.tenant_id
from public.profiles p
where d.tenant_id is null and d.user_id = p.id;

update public.ticket_comments c
set tenant_id = t.tenant_id
from public.tickets t
where c.tenant_id is null and c.ticket_id = t.id;

update public.ticket_activity a
set tenant_id = t.tenant_id
from public.tickets t
where a.tenant_id is null and a.ticket_id = t.id;

update public.device_notes n
set tenant_id = d.tenant_id
from public.devices d
where n.tenant_id is null and n.device_id = d.id;

update public.device_activity a
set tenant_id = d.tenant_id
from public.devices d
where a.tenant_id is null and a.device_id = d.id;

update public.ticket_devices td
set tenant_id = t.tenant_id
from public.tickets t
where td.tenant_id is null and td.ticket_id = t.id;

alter table public.tickets alter column tenant_id set default public.current_tenant_id();
alter table public.devices alter column tenant_id set default public.current_tenant_id();
alter table public.ticket_comments alter column tenant_id set default public.current_tenant_id();
alter table public.ticket_activity alter column tenant_id set default public.current_tenant_id();
alter table public.device_notes alter column tenant_id set default public.current_tenant_id();
alter table public.device_activity alter column tenant_id set default public.current_tenant_id();
alter table public.ticket_devices alter column tenant_id set default public.current_tenant_id();

create index if not exists tickets_tenant_idx on public.tickets (tenant_id, created_at desc);
create index if not exists devices_tenant_idx on public.devices (tenant_id, created_at desc);
create index if not exists ticket_comments_tenant_idx on public.ticket_comments (tenant_id, ticket_id);
create index if not exists ticket_activity_tenant_idx on public.ticket_activity (tenant_id, ticket_id);
create index if not exists device_notes_tenant_idx on public.device_notes (tenant_id, device_id);
create index if not exists device_activity_tenant_idx on public.device_activity (tenant_id, device_id);
create index if not exists ticket_devices_tenant_idx on public.ticket_devices (tenant_id, ticket_id, device_id);

create or replace function public.set_ticket_child_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select tenant_id into new.tenant_id from public.tickets where id = new.ticket_id;
  return new;
end;
$$;

create or replace function public.set_device_child_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select tenant_id into new.tenant_id from public.devices where id = new.device_id;
  return new;
end;
$$;

create or replace function public.set_ticket_device_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select tenant_id into new.tenant_id from public.tickets where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists set_ticket_comments_tenant on public.ticket_comments;
create trigger set_ticket_comments_tenant
  before insert on public.ticket_comments
  for each row execute function public.set_ticket_child_tenant();

drop trigger if exists set_ticket_activity_tenant on public.ticket_activity;
create trigger set_ticket_activity_tenant
  before insert on public.ticket_activity
  for each row execute function public.set_ticket_child_tenant();

drop trigger if exists set_device_notes_tenant on public.device_notes;
create trigger set_device_notes_tenant
  before insert on public.device_notes
  for each row execute function public.set_device_child_tenant();

drop trigger if exists set_device_activity_tenant on public.device_activity;
create trigger set_device_activity_tenant
  before insert on public.device_activity
  for each row execute function public.set_device_child_tenant();

drop trigger if exists set_ticket_devices_tenant on public.ticket_devices;
create trigger set_ticket_devices_tenant
  before insert on public.ticket_devices
  for each row execute function public.set_ticket_device_tenant();

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_users enable row level security;
alter table public.roles enable row level security;
alter table public.ticket_devices enable row level security;

drop policy if exists "Tenant members read tenant" on public.tenants;
create policy "Tenant members read tenant" on public.tenants
  for select using (public.is_tenant_member(id) or public.current_tenant_role() = 'super_admin');

drop policy if exists "Org admins update tenant" on public.tenants;
create policy "Org admins update tenant" on public.tenants
  for update using (
    public.is_tenant_member(id)
    and public.has_tenant_role(array['super_admin','org_admin'])
  )
  with check (
    public.is_tenant_member(id)
    and public.has_tenant_role(array['super_admin','org_admin'])
  );

drop policy if exists "Users read profiles in tenant" on public.profiles;
create policy "Users read profiles in tenant" on public.profiles
  for select using (public.is_tenant_member(tenant_id) or id = auth.uid());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (id = auth.uid() or public.has_tenant_role(array['super_admin','org_admin']))
  with check (public.is_tenant_member(tenant_id));

drop policy if exists "Tenant admins manage tenant users" on public.tenant_users;
create policy "Tenant admins manage tenant users" on public.tenant_users
  for all using (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin'])
  )
  with check (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin'])
  );

drop policy if exists "Tenant members read tenant users" on public.tenant_users;
create policy "Tenant members read tenant users" on public.tenant_users
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists "Tenant members read roles" on public.roles;
create policy "Tenant members read roles" on public.roles
  for select using (tenant_id is null or public.is_tenant_member(tenant_id));

drop policy if exists "Org admins manage custom roles" on public.roles;
create policy "Org admins manage custom roles" on public.roles
  for all using (
    tenant_id is not null
    and public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin'])
  )
  with check (
    tenant_id is not null
    and public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin'])
  );

-- Tenant-aware operational RLS. Existing user-owned rows remain accessible after backfill.
drop policy if exists "Users read own tickets" on public.tickets;
drop policy if exists "Tenant members read tickets" on public.tickets;
create policy "Tenant members read tickets" on public.tickets
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists "Users insert own tickets" on public.tickets;
drop policy if exists "Tenant members insert tickets" on public.tickets;
create policy "Tenant members insert tickets" on public.tickets
  for insert with check (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin','technician','employee'])
  );

drop policy if exists "Users update own tickets" on public.tickets;
drop policy if exists "Tenant staff update tickets" on public.tickets;
create policy "Tenant staff update tickets" on public.tickets
  for update using (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin','technician'])
  )
  with check (public.is_tenant_member(tenant_id));

drop policy if exists "Users delete own tickets" on public.tickets;
drop policy if exists "Tenant admins delete tickets" on public.tickets;
create policy "Tenant admins delete tickets" on public.tickets
  for delete using (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin'])
  );

drop policy if exists "Users read own devices" on public.devices;
drop policy if exists "Tenant members read devices" on public.devices;
create policy "Tenant members read devices" on public.devices
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists "Users insert own devices" on public.devices;
drop policy if exists "Tenant staff insert devices" on public.devices;
create policy "Tenant staff insert devices" on public.devices
  for insert with check (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin','technician'])
  );

drop policy if exists "Users update own devices" on public.devices;
drop policy if exists "Tenant staff update devices" on public.devices;
create policy "Tenant staff update devices" on public.devices
  for update using (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin','technician'])
  )
  with check (public.is_tenant_member(tenant_id));

drop policy if exists "Users delete own devices" on public.devices;
drop policy if exists "Tenant admins delete devices" on public.devices;
create policy "Tenant admins delete devices" on public.devices
  for delete using (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin'])
  );

-- Child tables inherit tenant access through tenant_id.
drop policy if exists "Users read comments on own tickets" on public.ticket_comments;
drop policy if exists "Tenant members read ticket comments" on public.ticket_comments;
create policy "Tenant members read ticket comments" on public.ticket_comments
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists "Users insert comments on own tickets" on public.ticket_comments;
drop policy if exists "Tenant staff insert ticket comments" on public.ticket_comments;
create policy "Tenant staff insert ticket comments" on public.ticket_comments
  for insert with check (public.is_tenant_member(tenant_id));

drop policy if exists "Users read activity on own tickets" on public.ticket_activity;
drop policy if exists "Tenant members read ticket activity" on public.ticket_activity;
create policy "Tenant members read ticket activity" on public.ticket_activity
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists "Users insert activity on own tickets" on public.ticket_activity;
drop policy if exists "Tenant staff insert ticket activity" on public.ticket_activity;
create policy "Tenant staff insert ticket activity" on public.ticket_activity
  for insert with check (public.is_tenant_member(tenant_id));

drop policy if exists "Users read notes on own devices" on public.device_notes;
drop policy if exists "Tenant members read device notes" on public.device_notes;
create policy "Tenant members read device notes" on public.device_notes
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists "Users insert notes on own devices" on public.device_notes;
drop policy if exists "Tenant staff insert device notes" on public.device_notes;
create policy "Tenant staff insert device notes" on public.device_notes
  for insert with check (public.is_tenant_member(tenant_id));

drop policy if exists "Users read activity on own devices" on public.device_activity;
drop policy if exists "Tenant members read device activity" on public.device_activity;
create policy "Tenant members read device activity" on public.device_activity
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists "Users insert activity on own devices" on public.device_activity;
drop policy if exists "Tenant staff insert device activity" on public.device_activity;
create policy "Tenant staff insert device activity" on public.device_activity
  for insert with check (public.is_tenant_member(tenant_id));

drop policy if exists "Users read ticket device links" on public.ticket_devices;
drop policy if exists "Tenant members read ticket device links" on public.ticket_devices;
create policy "Tenant members read ticket device links" on public.ticket_devices
  for select using (public.is_tenant_member(tenant_id));

drop policy if exists "Users insert ticket device links" on public.ticket_devices;
drop policy if exists "Tenant staff insert ticket device links" on public.ticket_devices;
create policy "Tenant staff insert ticket device links" on public.ticket_devices
  for insert with check (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin','technician'])
  );

drop policy if exists "Users delete ticket device links" on public.ticket_devices;
drop policy if exists "Tenant staff delete ticket device links" on public.ticket_devices;
create policy "Tenant staff delete ticket device links" on public.ticket_devices
  for delete using (
    public.is_tenant_member(tenant_id)
    and public.has_tenant_role(array['super_admin','org_admin','technician'])
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tenants'
  ) then
    alter publication supabase_realtime add table public.tenants;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tenant_users'
  ) then
    alter publication supabase_realtime add table public.tenant_users;
  end if;
end $$;

notify pgrst, 'reload schema';
