-- Emergency fix when adding a device fails from ticket-device activity triggers.
-- This keeps the ticket_devices relationship working and disables only the
-- optional trigger-based audit logging that depends on evolving activity schemas.

drop trigger if exists ticket_device_link_activity on public.ticket_devices;
drop trigger if exists ticket_device_unlink_activity on public.ticket_devices;

drop function if exists public.log_ticket_device_link();
drop function if exists public.log_ticket_device_unlink();

-- Ensure the relationship table exists and is usable.
create extension if not exists pgcrypto;

create table if not exists public.ticket_devices (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  device_id uuid not null references public.devices (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  relationship_type text not null default 'affected_asset',
  created_at timestamptz not null default now(),
  created_by_name text,
  created_by_email text,
  unique (ticket_id, device_id)
);

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

create index if not exists ticket_devices_ticket_idx on public.ticket_devices (ticket_id);
create index if not exists ticket_devices_device_idx on public.ticket_devices (device_id);
create index if not exists ticket_devices_user_idx on public.ticket_devices (user_id);

notify pgrst, 'reload schema';
