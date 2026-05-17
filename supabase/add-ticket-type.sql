-- Adds ticket type support for INC/SR/PRB/CHG ticket numbering.

alter table public.tickets
  add column if not exists ticket_type text not null default 'incident';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tickets_ticket_type_check'
  ) then
    alter table public.tickets
      add constraint tickets_ticket_type_check
      check (ticket_type in ('incident', 'service_request', 'problem', 'change_request'));
  end if;
end $$;

create index if not exists tickets_user_type_idx
  on public.tickets (user_id, ticket_type);
