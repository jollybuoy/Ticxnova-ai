alter table public.tenants
  add column if not exists mail_config jsonb not null default '{}'::jsonb;

comment on column public.tenants.mail_config is
  'Public mail relay settings (from address, SMTP host, IT inbox). Secrets live in tenant_mail_secrets.';

create table if not exists public.tenant_mail_secrets (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  secret_cipher text not null,
  updated_at timestamptz not null default now()
);

comment on table public.tenant_mail_secrets is
  'Per-tenant SMTP password or provider API key. Service role only.';

alter table public.tenant_mail_secrets enable row level security;

revoke all on table public.tenant_mail_secrets from anon, authenticated;
grant all on table public.tenant_mail_secrets to service_role;
