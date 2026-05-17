-- Fix for: column "type" of relation "ticket_activity" does not exist
-- Run this once in Supabase SQL Editor, then retry adding the device.

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

notify pgrst, 'reload schema';
