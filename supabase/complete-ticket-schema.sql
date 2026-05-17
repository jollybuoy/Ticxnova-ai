-- Complete Ticxnova-AI ticket schema for Supabase.
-- Covers current frontend queries for:
-- - tickets
-- - ticket_comments
-- - ticket_activity
--
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ticket_number text not null,
  title text not null,
  description text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'pending', 'resolved')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  category text,
  requester_name text,
  assignee_name text,
  department text,
  ai_summary text,
  ai_suggested_category text,
  ai_suggested_priority text,
  ai_reasoning text,
  ai_summary_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tickets
  add column if not exists requester_name text,
  add column if not exists assignee_name text,
  add column if not exists department text,
  add column if not exists ai_summary text,
  add column if not exists ai_suggested_category text,
  add column if not exists ai_suggested_priority text,
  add column if not exists ai_reasoning text,
  add column if not exists ai_summary_generated_at timestamptz;

create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null,
  author_name text,
  author_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_activity (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null
    check (type in ('status_change', 'field_update', 'comment', 'system')),
  field text,
  previous_value text,
  new_value text,
  message text not null,
  actor_name text,
  actor_email text,
  created_at timestamptz not null default now()
);

alter table public.ticket_comments
  alter column user_id set default auth.uid();

alter table public.ticket_activity
  alter column user_id set default auth.uid();

create unique index if not exists tickets_ticket_number_idx
  on public.tickets (ticket_number);
create index if not exists tickets_user_id_idx
  on public.tickets (user_id);
create index if not exists tickets_user_created_at_idx
  on public.tickets (user_id, created_at desc);
create index if not exists tickets_user_status_idx
  on public.tickets (user_id, status);
create index if not exists tickets_user_priority_idx
  on public.tickets (user_id, priority);

create index if not exists ticket_comments_ticket_id_created_at_idx
  on public.ticket_comments (ticket_id, created_at asc);
create index if not exists ticket_comments_user_id_idx
  on public.ticket_comments (user_id);

create index if not exists ticket_activity_ticket_id_created_at_idx
  on public.ticket_activity (ticket_id, created_at desc);
create index if not exists ticket_activity_user_id_idx
  on public.ticket_activity (user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tickets_set_updated_at on public.tickets;
drop trigger if exists tickets_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row
  execute function public.set_updated_at();

alter table public.tickets enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.ticket_activity enable row level security;

drop policy if exists "Users read own tickets" on public.tickets;
create policy "Users read own tickets"
  on public.tickets for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own tickets" on public.tickets;
create policy "Users insert own tickets"
  on public.tickets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own tickets" on public.tickets;
create policy "Users update own tickets"
  on public.tickets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own tickets" on public.tickets;
create policy "Users delete own tickets"
  on public.tickets for delete
  using (auth.uid() = user_id);

drop policy if exists "Users read comments on own tickets" on public.ticket_comments;
create policy "Users read comments on own tickets"
  on public.ticket_comments for select
  using (
    exists (
      select 1
      from public.tickets
      where tickets.id = ticket_comments.ticket_id
        and tickets.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert comments on own tickets" on public.ticket_comments;
create policy "Users insert comments on own tickets"
  on public.ticket_comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.tickets
      where tickets.id = ticket_comments.ticket_id
        and tickets.user_id = auth.uid()
    )
  );

drop policy if exists "Users read activity on own tickets" on public.ticket_activity;
create policy "Users read activity on own tickets"
  on public.ticket_activity for select
  using (
    exists (
      select 1
      from public.tickets
      where tickets.id = ticket_activity.ticket_id
        and tickets.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert activity on own tickets" on public.ticket_activity;
create policy "Users insert activity on own tickets"
  on public.ticket_activity for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.tickets
      where tickets.id = ticket_activity.ticket_id
        and tickets.user_id = auth.uid()
    )
  );

-- Optional but recommended for Supabase Realtime.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tickets'
  ) then
    alter publication supabase_realtime add table public.tickets;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ticket_comments'
  ) then
    alter publication supabase_realtime add table public.ticket_comments;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ticket_activity'
  ) then
    alter publication supabase_realtime add table public.ticket_activity;
  end if;
end $$;
