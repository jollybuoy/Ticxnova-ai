-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

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
  assignee_name text,
  department text,
  ai_summary text,
  ai_suggested_category text,
  ai_suggested_priority text,
  ai_reasoning text,
  ai_summary_generated_at timestamptz,
  requester_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tickets
  add column if not exists assignee_name text,
  add column if not exists department text,
  add column if not exists ai_summary text,
  add column if not exists ai_suggested_category text,
  add column if not exists ai_suggested_priority text,
  add column if not exists ai_reasoning text,
  add column if not exists ai_summary_generated_at timestamptz;

create index if not exists tickets_user_id_idx on public.tickets (user_id);
create index if not exists tickets_status_idx on public.tickets (status);
create unique index if not exists tickets_ticket_number_idx on public.tickets (ticket_number);

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

alter table public.tickets enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.ticket_activity enable row level security;

create policy "Users read own tickets"
  on public.tickets for select
  using (auth.uid() = user_id);

create policy "Users insert own tickets"
  on public.tickets for insert
  with check (auth.uid() = user_id);

create policy "Users update own tickets"
  on public.tickets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own tickets"
  on public.tickets for delete
  using (auth.uid() = user_id);

create policy "Users read comments on own tickets"
  on public.ticket_comments for select
  using (
    exists (
      select 1 from public.tickets
      where tickets.id = ticket_comments.ticket_id
        and tickets.user_id = auth.uid()
    )
  );

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

create policy "Users read activity on own tickets"
  on public.ticket_activity for select
  using (
    exists (
      select 1 from public.tickets
      where tickets.id = ticket_activity.ticket_id
        and tickets.user_id = auth.uid()
    )
  );

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

create or replace function public.set_tickets_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tickets_updated_at on public.tickets;
create trigger tickets_updated_at
  before update on public.tickets
  for each row execute function public.set_tickets_updated_at();
