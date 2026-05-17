-- Complete Ticxnova-AI Asset & Device Management schema.
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  asset_tag text not null,
  name text not null,
  device_type text not null default 'Laptop'
    check (device_type in ('Laptop', 'Desktop', 'Server', 'Network Device', 'Mobile Device')),
  serial_number text,
  assigned_user text,
  department text,
  location text,
  manufacturer text,
  model text,
  purchase_date date,
  warranty_expiry date,
  health_status text not null default 'Healthy'
    check (health_status in ('Healthy', 'Warning', 'Critical', 'Offline')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_notes (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null,
  author_name text,
  author_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.device_activity (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null default 'field_update',
  field text,
  previous_value text,
  new_value text,
  message text not null,
  actor_name text,
  actor_email text,
  created_at timestamptz not null default now()
);

create unique index if not exists devices_asset_tag_idx on public.devices (asset_tag);
create index if not exists devices_user_id_idx on public.devices (user_id);
create index if not exists devices_user_created_at_idx on public.devices (user_id, created_at desc);
create index if not exists devices_user_status_idx on public.devices (user_id, health_status);
create index if not exists devices_user_type_idx on public.devices (user_id, device_type);
create index if not exists devices_warranty_idx on public.devices (user_id, warranty_expiry);
create index if not exists device_notes_device_created_idx on public.device_notes (device_id, created_at asc);
create index if not exists device_activity_device_created_idx on public.device_activity (device_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists devices_set_updated_at on public.devices;
create trigger devices_set_updated_at
  before update on public.devices
  for each row execute function public.set_updated_at();

alter table public.devices enable row level security;
alter table public.device_notes enable row level security;
alter table public.device_activity enable row level security;

drop policy if exists "Users read own devices" on public.devices;
create policy "Users read own devices" on public.devices
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own devices" on public.devices;
create policy "Users insert own devices" on public.devices
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own devices" on public.devices;
create policy "Users update own devices" on public.devices
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users delete own devices" on public.devices;
create policy "Users delete own devices" on public.devices
  for delete using (auth.uid() = user_id);

drop policy if exists "Users read notes on own devices" on public.device_notes;
create policy "Users read notes on own devices" on public.device_notes
  for select using (
    exists (
      select 1 from public.devices
      where devices.id = device_notes.device_id
        and devices.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert notes on own devices" on public.device_notes;
create policy "Users insert notes on own devices" on public.device_notes
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.devices
      where devices.id = device_notes.device_id
        and devices.user_id = auth.uid()
    )
  );

drop policy if exists "Users read activity on own devices" on public.device_activity;
create policy "Users read activity on own devices" on public.device_activity
  for select using (
    exists (
      select 1 from public.devices
      where devices.id = device_activity.device_id
        and devices.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert activity on own devices" on public.device_activity;
create policy "Users insert activity on own devices" on public.device_activity
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.devices
      where devices.id = device_activity.device_id
        and devices.user_id = auth.uid()
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'devices'
  ) then
    alter publication supabase_realtime add table public.devices;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'device_notes'
  ) then
    alter publication supabase_realtime add table public.device_notes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'device_activity'
  ) then
    alter publication supabase_realtime add table public.device_activity;
  end if;
end $$;
