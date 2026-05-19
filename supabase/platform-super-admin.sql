-- Ticxnova platform super admin (internal /admin portal).
-- Run after multi-tenant-rbac.sql and workspace-onboarding.sql.
--
-- Bootstrap super admin (user must exist in Authentication first):
--   Email: jollybuoytech@gmail.com
--   Set password in Supabase Auth (e.g. Test@123) — change after first login in /admin/profile

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists platform_admins_email_idx on public.platform_admins (lower(email));

alter table public.profiles
  add column if not exists is_active boolean not null default true;

alter table public.tenants
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
      and pa.is_active = true
  );
$$;

create or replace function public.touch_platform_admin_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.platform_admins
  set last_login_at = now()
  where user_id = auth.uid()
    and is_active = true;
end;
$$;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.touch_platform_admin_login() to authenticated;

alter table public.platform_admins enable row level security;

drop policy if exists "Platform admins read own row" on public.platform_admins;
create policy "Platform admins read own row" on public.platform_admins
  for select using (user_id = auth.uid());

-- Link bootstrap super admin by email (safe to re-run)
insert into public.platform_admins (user_id, email, display_name, is_active)
select
  u.id,
  lower(u.email),
  coalesce(u.raw_user_meta_data->>'full_name', 'Ticxnova Super Admin'),
  true
from auth.users u
where lower(u.email) = 'jollybuoytech@gmail.com'
on conflict (user_id) do update set
  email = excluded.email,
  is_active = true,
  display_name = coalesce(public.platform_admins.display_name, excluded.display_name);

-- Promote profile role for visibility in tenant apps (optional)
update public.profiles p
set role = 'super_admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = 'jollybuoytech@gmail.com';
