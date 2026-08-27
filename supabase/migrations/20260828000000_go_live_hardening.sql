-- Go-live hardening: ticket RLS is tenant-scoped, password-reset flag is not user-editable.

-- ---------------------------------------------------------------------------
-- Tickets: drop leftover user-owned policies from the early tickets.sql script
-- ---------------------------------------------------------------------------
drop policy if exists "Users read own tickets" on public.tickets;
drop policy if exists "Users insert own tickets" on public.tickets;
drop policy if exists "Users update own tickets" on public.tickets;
drop policy if exists "Users delete own tickets" on public.tickets;
drop policy if exists "Users can manage their own tickets" on public.tickets;

drop policy if exists "Users read comments on own tickets" on public.ticket_comments;
drop policy if exists "Users insert comments on own tickets" on public.ticket_comments;
drop policy if exists "Users read activity on own tickets" on public.ticket_activity;
drop policy if exists "Users insert activity on own tickets" on public.ticket_activity;

-- ---------------------------------------------------------------------------
-- Password reset must live on profiles + app_metadata, never user_metadata.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists must_reset_password boolean not null default false;

create or replace function public.complete_own_password_reset()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
  set must_reset_password = false
  where id = auth.uid();

  update auth.users
  set
    raw_app_meta_data =
      coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('must_reset_password', false),
    raw_user_meta_data =
      coalesce(raw_user_meta_data, '{}'::jsonb) - 'must_reset_password'
  where id = auth.uid();
end;
$$;

revoke all on function public.complete_own_password_reset() from public;
grant execute on function public.complete_own_password_reset() to authenticated;
