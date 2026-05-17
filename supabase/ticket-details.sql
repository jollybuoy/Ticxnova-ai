-- Run this after supabase/tickets.sql to enable enterprise ticket details.

alter table public.tickets
  add column if not exists assignee_name text,
  add column if not exists department text;

create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  author_name text,
  author_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_activity (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  field text,
  previous_value text,
  new_value text,
  message text not null,
  actor_name text,
  actor_email text,
  created_at timestamptz not null default now()
);

create index if not exists ticket_comments_ticket_id_idx
  on public.ticket_comments (ticket_id, created_at desc);
create index if not exists ticket_activity_ticket_id_idx
  on public.ticket_activity (ticket_id, created_at desc);

alter table public.ticket_comments enable row level security;
alter table public.ticket_activity enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ticket_comments'
      and policyname = 'Users read comments on own tickets'
  ) then
    create policy "Users read comments on own tickets"
      on public.ticket_comments for select
      using (
        exists (
          select 1 from public.tickets
          where tickets.id = ticket_comments.ticket_id
            and tickets.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ticket_comments'
      and policyname = 'Users insert comments on own tickets'
  ) then
    create policy "Users insert comments on own tickets"
      on public.ticket_comments for insert
      with check (
        auth.uid() = user_id
        and exists (
          select 1 from public.tickets
          where tickets.id = ticket_comments.ticket_id
            and tickets.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ticket_activity'
      and policyname = 'Users read activity on own tickets'
  ) then
    create policy "Users read activity on own tickets"
      on public.ticket_activity for select
      using (
        exists (
          select 1 from public.tickets
          where tickets.id = ticket_activity.ticket_id
            and tickets.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ticket_activity'
      and policyname = 'Users insert activity on own tickets'
  ) then
    create policy "Users insert activity on own tickets"
      on public.ticket_activity for insert
      with check (
        auth.uid() = user_id
        and exists (
          select 1 from public.tickets
          where tickets.id = ticket_activity.ticket_id
            and tickets.user_id = auth.uid()
        )
      );
  end if;
end $$;
