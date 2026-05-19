-- Admin: inspect workspaces, delete test users, release domains, keep test account.
-- Run in Supabase Dashboard → SQL → New query (service role / postgres access).
--
-- TEST ACCOUNT (do not delete):
--   jollybuoytech@gmail.com
--
-- Order when removing a signup test:
--   1) Delete auth user (frees email)
--   2) Delete orphan tenant row (frees organization domain)
--   Or run admin_delete_workspace_by_email() below.

-- ---------------------------------------------------------------------------
-- 1) INSPECT — run first to see what is blocking new signups
-- ---------------------------------------------------------------------------

-- All organization domains (active tenants)
select
  t.id as tenant_id,
  t.company_name,
  t.domain,
  t.subscription_plan,
  t.is_active,
  t.created_at
from public.tenants t
where t.is_active = true
order by t.created_at desc;

-- Auth users + workspace metadata
select
  u.id as user_id,
  lower(u.email) as email,
  u.created_at,
  u.email_confirmed_at is not null as email_confirmed,
  u.raw_user_meta_data->>'company_name' as company_name,
  u.raw_user_meta_data->>'domain' as signup_domain,
  u.raw_user_meta_data->>'is_test_account' as is_test_account
from auth.users u
order by u.created_at desc;

-- Profiles linked to tenants
select
  p.id as user_id,
  lower(p.email) as email,
  p.role,
  p.tenant_id,
  t.domain as tenant_domain,
  t.company_name
from public.profiles p
left join public.tenants t on t.id = p.tenant_id
order by p.created_at desc;

-- Orphan tenants (no profile) — these domains stay reserved after user delete
select
  t.id as tenant_id,
  t.company_name,
  t.domain,
  t.created_at
from public.tenants t
where t.is_active = true
  and not exists (
    select 1 from public.profiles p where p.tenant_id = t.id
  )
order by t.created_at desc;

-- ---------------------------------------------------------------------------
-- 2) MARK TEST ACCOUNT — jollybuoytech@gmail.com
-- ---------------------------------------------------------------------------

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
  'is_test_account', true,
  'account_type', 'test',
  'workspace_onboarding', 'true'
)
where lower(email) = 'jollybuoytech@gmail.com';

-- Optional: tag the tenant owned by the test user
update public.tenants t
set company_name = coalesce(nullif(trim(t.company_name), ''), 'Jollybuoy Test Workspace')
from public.profiles p
where p.tenant_id = t.id
  and lower(p.email) = 'jollybuoytech@gmail.com';

-- ---------------------------------------------------------------------------
-- 3) DELETE ONE TEST USER + RELEASE THEIR DOMAIN
-- ---------------------------------------------------------------------------

create or replace function public.admin_delete_workspace_by_email(target_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(trim(coalesce(target_email, '')));
  auth_user_id uuid;
  signup_domain text;
  email_domain_name text;
  tenant_ids uuid[] := '{}';
  deleted_tenant_count integer := 0;
  protected_test_email constant text := 'jollybuoytech@gmail.com';
begin
  if normalized_email = '' then
    return jsonb_build_object('success', false, 'message', 'Email is required.');
  end if;

  if normalized_email = protected_test_email then
    return jsonb_build_object(
      'success', false,
      'message', 'Protected test account cannot be deleted via this helper.'
    );
  end if;

  select u.id, nullif(trim(u.raw_user_meta_data->>'domain'), '')
  into auth_user_id, signup_domain
  from auth.users u
  where lower(u.email) = normalized_email;

  email_domain_name := public.email_domain(normalized_email);

  select coalesce(array_agg(distinct tid), '{}')
  into tenant_ids
  from (
    select p.tenant_id as tid
    from public.profiles p
    where p.id = auth_user_id
      and p.tenant_id is not null
    union
    select t.id as tid
    from public.tenants t
    where not exists (select 1 from public.profiles p where p.tenant_id = t.id)
      and (
        (signup_domain is not null and lower(t.domain) = lower(signup_domain))
        or (email_domain_name is not null and lower(t.domain) = email_domain_name)
      )
  ) candidates;

  if auth_user_id is not null then
    delete from auth.users where id = auth_user_id;
  end if;

  delete from public.tenants t
  where t.id = any(tenant_ids)
    and not exists (select 1 from public.profiles p where p.tenant_id = t.id);

  get diagnostics deleted_tenant_count = row_count;

  return jsonb_build_object(
    'success', true,
    'email', normalized_email,
    'auth_user_deleted', auth_user_id is not null,
    'deleted_tenant_count', deleted_tenant_count,
    'released_domains', array[
      signup_domain,
      email_domain_name
    ],
    'message', 'User removed (if present) and matching orphan tenant domains released.'
  );
end;
$$;

-- Example: remove a single test signup (change the email)
-- select public.admin_delete_workspace_by_email('other.test@example.com');

-- ---------------------------------------------------------------------------
-- 4) BULK RELEASE ORPHAN DOMAINS (keeps tenants tied to test account)
-- ---------------------------------------------------------------------------

create or replace function public.admin_purge_orphan_tenants()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  protected_tenant_id uuid;
  deleted_count integer := 0;
begin
  select p.tenant_id into protected_tenant_id
  from public.profiles p
  where lower(p.email) = 'jollybuoytech@gmail.com'
  limit 1;

  delete from public.tenants t
  where not exists (select 1 from public.profiles p where p.tenant_id = t.id)
    and (protected_tenant_id is null or t.id is distinct from protected_tenant_id);

  get diagnostics deleted_count = row_count;

  return jsonb_build_object(
    'success', true,
    'deleted_tenant_count', deleted_count,
    'protected_test_tenant_id', protected_tenant_id,
    'message', 'Orphan tenant rows removed; domains are available again for signup.'
  );
end;
$$;

-- Run bulk orphan cleanup:
-- select public.admin_purge_orphan_tenants();

-- ---------------------------------------------------------------------------
-- 5) MANUAL DOMAIN RELEASE (when you know the domain string)
-- ---------------------------------------------------------------------------

-- Preview tenant for a domain:
-- select * from public.tenants where lower(domain) = lower('company.com');

-- Delete tenant by domain (only if no profiles — safe for abandoned tests):
-- delete from public.tenants
-- where lower(domain) = lower('company.com')
--   and not exists (select 1 from public.profiles p where p.tenant_id = tenants.id);

-- ---------------------------------------------------------------------------
-- 6) REVOKE admin helpers (optional, after maintenance)
-- ---------------------------------------------------------------------------

-- drop function if exists public.admin_delete_workspace_by_email(text);
-- drop function if exists public.admin_purge_orphan_tenants();
