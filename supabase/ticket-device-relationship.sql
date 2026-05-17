-- Ticket <-> Device relationship layer for ITSM workflows.
-- Run after supabase/complete-ticket-schema.sql and supabase/devices-schema.sql.

create extension if not exists pgcrypto;

-- Backfill audit columns for projects that were created from an older ticket schema.
alter table public.ticket_activity
  add column if not exists type text not null default 'system',
  add column if not exists field text,
  add column if not exists previous_value text,
  add column if not exists new_value text,
  add column if not exists message text not null default 'activity updated',
  add column if not exists actor_name text,
  add column if not exists actor_email text;

alter table public.device_activity
  add column if not exists type text not null default 'field_update',
  add column if not exists field text,
  add column if not exists previous_value text,
  add column if not exists new_value text,
  add column if not exists message text not null default 'activity updated',
  add column if not exists actor_name text,
  add column if not exists actor_email text;

do $$
begin
  alter table public.ticket_activity drop constraint if exists ticket_activity_type_check;
  alter table public.ticket_activity
    add constraint ticket_activity_type_check
    check (
      type in (
        'status_change',
        'field_update',
        'comment',
        'system',
        'device_linked',
        'device_unlinked'
      )
    );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.ticket_devices (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  device_id uuid not null references public.devices (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  relationship_type text not null default 'affected_asset'
    check (relationship_type in ('affected_asset', 'related_asset', 'primary_asset')),
  created_at timestamptz not null default now(),
  created_by_name text,
  created_by_email text,
  unique (ticket_id, device_id)
);

create index if not exists ticket_devices_ticket_idx on public.ticket_devices (ticket_id);
create index if not exists ticket_devices_device_idx on public.ticket_devices (device_id);
create index if not exists ticket_devices_user_idx on public.ticket_devices (user_id);
create index if not exists ticket_devices_user_device_idx on public.ticket_devices (user_id, device_id);
create index if not exists ticket_devices_user_ticket_idx on public.ticket_devices (user_id, ticket_id);

alter table public.ticket_devices enable row level security;

drop policy if exists "Users read own ticket device links" on public.ticket_devices;
create policy "Users read own ticket device links" on public.ticket_devices
  for select using (
    auth.uid() = user_id
    and exists (
      select 1 from public.tickets
      where tickets.id = ticket_devices.ticket_id
        and tickets.user_id = auth.uid()
    )
    and exists (
      select 1 from public.devices
      where devices.id = ticket_devices.device_id
        and devices.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert own ticket device links" on public.ticket_devices;
create policy "Users insert own ticket device links" on public.ticket_devices
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.tickets
      where tickets.id = ticket_devices.ticket_id
        and tickets.user_id = auth.uid()
    )
    and exists (
      select 1 from public.devices
      where devices.id = ticket_devices.device_id
        and devices.user_id = auth.uid()
    )
  );

drop policy if exists "Users update own ticket device links" on public.ticket_devices;
create policy "Users update own ticket device links" on public.ticket_devices
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users delete own ticket device links" on public.ticket_devices;
create policy "Users delete own ticket device links" on public.ticket_devices
  for delete using (auth.uid() = user_id);

create or replace function public.log_ticket_device_link()
returns trigger as $$
declare
  linked_ticket_number text;
  linked_device_name text;
begin
  select ticket_number into linked_ticket_number from public.tickets where id = new.ticket_id;
  select name into linked_device_name from public.devices where id = new.device_id;

  insert into public.ticket_activity (
    ticket_id,
    user_id,
    type,
    field,
    new_value,
    message,
    actor_name,
    actor_email
  )
  values (
    new.ticket_id,
    new.user_id,
    'device_linked',
    'device_id',
    new.device_id::text,
    'linked affected device ' || coalesce(linked_device_name, new.device_id::text),
    new.created_by_name,
    new.created_by_email
  );

  insert into public.device_activity (
    device_id,
    user_id,
    type,
    field,
    new_value,
    message,
    actor_name,
    actor_email
  )
  values (
    new.device_id,
    new.user_id,
    'ticket_linked',
    'ticket_id',
    new.ticket_id::text,
    'linked to ticket ' || coalesce(linked_ticket_number, new.ticket_id::text),
    new.created_by_name,
    new.created_by_email
  );

  return new;
end;
$$ language plpgsql security definer;

create or replace function public.log_ticket_device_unlink()
returns trigger as $$
declare
  linked_ticket_number text;
  linked_device_name text;
begin
  select ticket_number into linked_ticket_number from public.tickets where id = old.ticket_id;
  select name into linked_device_name from public.devices where id = old.device_id;

  insert into public.ticket_activity (
    ticket_id,
    user_id,
    type,
    field,
    previous_value,
    message,
    actor_name,
    actor_email
  )
  values (
    old.ticket_id,
    old.user_id,
    'device_unlinked',
    'device_id',
    old.device_id::text,
    'removed affected device ' || coalesce(linked_device_name, old.device_id::text),
    old.created_by_name,
    old.created_by_email
  );

  insert into public.device_activity (
    device_id,
    user_id,
    type,
    field,
    previous_value,
    message,
    actor_name,
    actor_email
  )
  values (
    old.device_id,
    old.user_id,
    'ticket_unlinked',
    'ticket_id',
    old.ticket_id::text,
    'removed link to ticket ' || coalesce(linked_ticket_number, old.ticket_id::text),
    old.created_by_name,
    old.created_by_email
  );

  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists ticket_device_link_activity on public.ticket_devices;
drop trigger if exists ticket_device_unlink_activity on public.ticket_devices;

-- Trigger-based audit logging is intentionally disabled by default because some
-- existing projects have older ticket_activity/device_activity shapes. The app
-- can create and display relationships without these optional triggers.
-- Uncomment only after confirming both activity tables match the complete schema.
-- create trigger ticket_device_link_activity
--   after insert on public.ticket_devices
--   for each row execute function public.log_ticket_device_link();
--
-- create trigger ticket_device_unlink_activity
--   after delete on public.ticket_devices
--   for each row execute function public.log_ticket_device_unlink();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ticket_devices'
  ) then
    alter publication supabase_realtime add table public.ticket_devices;
  end if;
end $$;

notify pgrst, 'reload schema';
