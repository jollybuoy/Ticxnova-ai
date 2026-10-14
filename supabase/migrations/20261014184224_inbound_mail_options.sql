alter table public.tenant_mail_secrets
  alter column secret_cipher drop not null;

alter table public.tenant_mail_secrets
  add column if not exists inbound_secret_cipher text;

comment on column public.tenant_mail_secrets.inbound_secret_cipher is
  'Per-workspace key for the inbound email-to-ticket webhook.';
