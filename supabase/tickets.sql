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
  requester_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_user_id_idx on public.tickets (user_id);
create index if not exists tickets_status_idx on public.tickets (status);
create unique index if not exists tickets_ticket_number_idx on public.tickets (ticket_number);

alter table public.tickets enable row level security;

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
