-- Fix RLS inserts for work notes/comments and activity logs.
-- Run this in Supabase SQL Editor.

alter table public.ticket_comments
  alter column user_id set default auth.uid();

alter table public.ticket_activity
  alter column user_id set default auth.uid();

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
    user_id = auth.uid()
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
    user_id = auth.uid()
    and exists (
      select 1
      from public.tickets
      where tickets.id = ticket_activity.ticket_id
        and tickets.user_id = auth.uid()
    )
  );
