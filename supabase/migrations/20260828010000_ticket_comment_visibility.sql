-- Optional: native visibility for ticket comments. The app also stores a
-- [[visibility:public]] body prefix if this column is not present yet.

alter table public.ticket_comments
  add column if not exists visibility text not null default 'internal';

alter table public.ticket_comments
  drop constraint if exists ticket_comments_visibility_check;

alter table public.ticket_comments
  add constraint ticket_comments_visibility_check
  check (visibility in ('internal', 'public'));
