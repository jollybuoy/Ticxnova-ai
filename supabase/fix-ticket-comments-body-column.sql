-- Fix legacy ticket_comments.comment column conflict.
-- The current frontend writes work notes to ticket_comments.body.
-- If your database has an older NOT NULL "comment" column, inserts fail unless
-- that old constraint is removed or mapped.

alter table public.ticket_comments
  add column if not exists body text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ticket_comments'
      and column_name = 'comment'
  ) then
    execute '
      update public.ticket_comments
      set body = coalesce(body, comment)
      where body is null
    ';

    execute '
      alter table public.ticket_comments
      alter column comment drop not null
    ';
  end if;
end $$;

update public.ticket_comments
set body = coalesce(body, '')
where body is null;

alter table public.ticket_comments
  alter column body set not null,
  alter column user_id set default auth.uid();
