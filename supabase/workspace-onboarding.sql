-- Workspace onboarding for public "Create Workspace" flow.
-- Run after supabase/multi-tenant-rbac.sql
--
-- Supabase Dashboard → SQL → New query → paste this entire file → Run.
-- Required for /get-started: check_workspace_signup_available,
-- finalize_workspace_onboarding, get_my_workspace_status, and the updated
-- handle_new_auth_user trigger on auth.users.

create or replace function public.normalize_workspace_domain(raw_domain text)
returns text
language plpgsql
immutable
as $$
declare
  cleaned text;
begin
  cleaned := lower(trim(coalesce(raw_domain, '')));
  cleaned := regexp_replace(cleaned, '^https?://', '');
  cleaned := regexp_replace(cleaned, '^www\.', '');
  cleaned := split_part(cleaned, '/', 1);
  return nullif(cleaned, '');
end;
$$;

create or replace function public.is_valid_subscription_plan(plan text)
returns boolean
language sql
immutable
as $$
  select lower(trim(coalesce(plan, ''))) in ('starter', 'professional', 'enterprise')
$$;

create or replace function public.is_workspace_onboarding_flag(metadata jsonb)
returns boolean
language sql
immutable
as $$
  select coalesce(
    lower(coalesce(metadata->>'workspace_onboarding', '')) in ('true', '1', 'yes'),
    (metadata->'workspace_onboarding')::text = 'true',
    false
  )
$$;

create unique index if not exists tenants_domain_unique_idx
  on public.tenants (lower(domain))
  where domain is not null and is_active = true;

create or replace function public.check_workspace_signup_available(
  target_email text,
  target_domain text,
  target_plan text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(trim(coalesce(target_email, '')));
  normalized_domain text := public.normalize_workspace_domain(target_domain);
begin
  if normalized_email = '' or position('@' in normalized_email) = 0 then
    return jsonb_build_object(
      'available', false,
      'code', 'invalid_email',
      'message', 'Enter a valid work email address.'
    );
  end if;

  if normalized_domain is null then
    return jsonb_build_object(
      'available', false,
      'code', 'invalid_domain',
      'message', 'Enter a valid primary domain (for example, company.com).'
    );
  end if;

  if public.is_valid_subscription_plan(target_plan) = false then
    return jsonb_build_object(
      'available', false,
      'code', 'invalid_plan',
      'message', 'Choose a valid subscription plan.'
    );
  end if;

  if exists (
    select 1
    from auth.users u
    where lower(u.email) = normalized_email
  ) then
    return jsonb_build_object(
      'available', false,
      'code', 'email_taken',
      'message', 'An account with this email already exists. Sign in instead.'
    );
  end if;

  if exists (
    select 1
    from public.profiles p
    where lower(p.email) = normalized_email
  ) then
    return jsonb_build_object(
      'available', false,
      'code', 'email_taken',
      'message', 'An account with this email already exists. Sign in instead.'
    );
  end if;

  if exists (
    select 1
    from public.tenants t
    where lower(t.domain) = normalized_domain
      and t.is_active = true
  ) then
    return jsonb_build_object(
      'available', false,
      'code', 'domain_taken',
      'message', 'This organization domain is already registered. Contact your administrator or use a different domain.'
    );
  end if;

  return jsonb_build_object('available', true);
end;
$$;

create or replace function public.provision_workspace(
  target_user_id uuid,
  target_email text,
  target_company_name text,
  target_domain text,
  target_plan text,
  target_full_name text default null,
  target_department text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  company_name text := trim(coalesce(target_company_name, ''));
  domain_name text := public.normalize_workspace_domain(target_domain);
  plan_name text := lower(trim(coalesce(target_plan, 'starter')));
  full_name text := nullif(trim(coalesce(target_full_name, '')), '');
  department_name text := nullif(trim(coalesce(target_department, '')), '');
  normalized_email text := lower(trim(coalesce(target_email, '')));
  new_tenant_id uuid;
begin
  if target_user_id is null or normalized_email = '' then
    raise exception 'Authenticated user is required.'
      using errcode = 'check_violation', detail = 'missing_user';
  end if;

  if company_name = '' then
    raise exception 'Company name is required.'
      using errcode = 'check_violation', detail = 'missing_company';
  end if;

  if domain_name is null then
    raise exception 'Primary domain is required.'
      using errcode = 'check_violation', detail = 'missing_domain';
  end if;

  if public.is_valid_subscription_plan(plan_name) = false then
    raise exception 'Invalid subscription plan.'
      using errcode = 'check_violation', detail = 'invalid_plan';
  end if;

  if exists (
    select 1
    from public.tenants t
    where lower(t.domain) = domain_name
      and t.is_active = true
  ) then
    raise exception 'This organization domain is already registered.'
      using errcode = 'unique_violation', detail = 'domain_taken';
  end if;

  insert into public.tenants (company_name, domain, subscription_plan)
  values (company_name, domain_name, plan_name)
  returning id into new_tenant_id;

  insert into public.profiles (id, tenant_id, email, full_name, role, department)
  values (
    target_user_id,
    new_tenant_id,
    normalized_email,
    full_name,
    'org_admin',
    department_name
  )
  on conflict (id) do update set
    tenant_id = excluded.tenant_id,
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = 'org_admin',
    department = coalesce(excluded.department, public.profiles.department);

  insert into public.tenant_users (tenant_id, user_id, email, full_name, role, department, joined_at)
  values (
    new_tenant_id,
    target_user_id,
    normalized_email,
    full_name,
    'org_admin',
    department_name,
    now()
  )
  on conflict (tenant_id, email) do update set
    user_id = excluded.user_id,
    full_name = coalesce(excluded.full_name, public.tenant_users.full_name),
    role = 'org_admin',
    department = coalesce(excluded.department, public.tenant_users.department),
    is_active = true,
    joined_at = coalesce(public.tenant_users.joined_at, now());

  return new_tenant_id;
end;
$$;

create or replace function public.provision_workspace_for_auth_user(target_user auth.users)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.provision_workspace(
    target_user.id,
    target_user.email,
    target_user.raw_user_meta_data->>'company_name',
    target_user.raw_user_meta_data->>'domain',
    target_user.raw_user_meta_data->>'subscription_plan',
    coalesce(
      nullif(trim(target_user.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(target_user.raw_user_meta_data->>'name'), '')
    ),
    nullif(trim(target_user.raw_user_meta_data->>'department'), '')
  );
end;
$$;

create or replace function public.finalize_workspace_onboarding(
  target_company_name text,
  target_domain text,
  target_plan text,
  target_full_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  auth_user auth.users%rowtype;
  existing_tenant_id uuid;
  new_tenant_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'success', false,
      'code', 'not_authenticated',
      'message', 'Sign in is required to finish workspace setup.'
    );
  end if;

  select tenant_id into existing_tenant_id
  from public.profiles
  where id = auth.uid();

  if existing_tenant_id is not null then
    return jsonb_build_object(
      'success', true,
      'tenant_id', existing_tenant_id,
      'message', 'Workspace already provisioned.'
    );
  end if;

  select * into auth_user
  from auth.users
  where id = auth.uid();

  if auth_user.id is null then
    return jsonb_build_object(
      'success', false,
      'code', 'missing_user',
      'message', 'Authenticated user record was not found.'
    );
  end if;

  new_tenant_id := public.provision_workspace(
    auth_user.id,
    auth_user.email,
    target_company_name,
    target_domain,
    target_plan,
    coalesce(nullif(trim(target_full_name), ''), auth_user.raw_user_meta_data->>'full_name', auth_user.raw_user_meta_data->>'name'),
    auth_user.raw_user_meta_data->>'department'
  );

  return jsonb_build_object(
    'success', true,
    'tenant_id', new_tenant_id,
    'message', 'Workspace provisioned successfully.'
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'code', 'provision_failed',
      'message', SQLERRM,
      'detail', coalesce(SQLSTATE, '')
    );
end;
$$;

create or replace function public.get_my_workspace_status()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  profile_record public.profiles%rowtype;
  tenant_record public.tenants%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('authenticated', false);
  end if;

  select * into profile_record
  from public.profiles
  where id = auth.uid();

  if profile_record.id is null then
    return jsonb_build_object(
      'authenticated', true,
      'has_profile', false,
      'has_tenant', false
    );
  end if;

  if profile_record.tenant_id is not null then
    select * into tenant_record
    from public.tenants
    where id = profile_record.tenant_id;
  end if;

  return jsonb_build_object(
    'authenticated', true,
    'has_profile', true,
    'has_tenant', profile_record.tenant_id is not null,
    'tenant_id', profile_record.tenant_id,
    'role', profile_record.role,
    'company_name', tenant_record.company_name,
    'domain', tenant_record.domain,
    'subscription_plan', tenant_record.subscription_plan
  );
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_tenant_id uuid;
  metadata_role text;
  metadata_department text;
begin
  if public.is_workspace_onboarding_flag(new.raw_user_meta_data) then
    perform public.provision_workspace_for_auth_user(new);
    return new;
  end if;

  metadata_tenant_id := nullif(new.raw_user_meta_data->>'tenant_id', '')::uuid;
  metadata_role := coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'employee');
  metadata_department := nullif(new.raw_user_meta_data->>'department', '');

  if metadata_tenant_id is not null then
    insert into public.profiles (id, tenant_id, email, full_name, role, department)
    values (
      new.id,
      metadata_tenant_id,
      lower(new.email),
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      metadata_role,
      metadata_department
    )
    on conflict (id) do update set
      tenant_id = excluded.tenant_id,
      email = excluded.email,
      role = excluded.role,
      department = excluded.department;

    insert into public.tenant_users (tenant_id, user_id, email, full_name, role, department, joined_at)
    values (
      metadata_tenant_id,
      new.id,
      lower(new.email),
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      metadata_role,
      metadata_department,
      now()
    )
    on conflict (tenant_id, email) do update set
      user_id = excluded.user_id,
      full_name = excluded.full_name,
      role = excluded.role,
      department = excluded.department,
      is_active = true,
      joined_at = coalesce(public.tenant_users.joined_at, now());

    return new;
  end if;

  perform public.ensure_user_tenant(
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

grant execute on function public.check_workspace_signup_available(text, text, text) to anon, authenticated;
grant execute on function public.finalize_workspace_onboarding(text, text, text, text) to authenticated;
grant execute on function public.get_my_workspace_status() to authenticated;
grant execute on function public.normalize_workspace_domain(text) to anon, authenticated;
