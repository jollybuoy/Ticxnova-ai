-- Domain verification & tenant approval workflow.
-- Run after workspace-onboarding.sql and platform-super-admin.sql

alter table public.tenants
  add column if not exists verification_status text not null default 'verified',
  add column if not exists domain_verified boolean not null default true,
  add column if not exists verification_method text,
  add column if not exists verification_token text,
  add column if not exists approved_by uuid references auth.users (id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_reason text,
  add column if not exists verification_requested_at timestamptz,
  add column if not exists business_email_verified_at timestamptz;

-- Existing workspaces keep full access (only new signups start pending).
update public.tenants
set
  verification_status = 'verified',
  domain_verified = true
where domain_verified = true
  and verification_status = 'verified';

alter table public.tenants
  drop constraint if exists tenants_verification_status_check;

alter table public.tenants
  add constraint tenants_verification_status_check
  check (
    verification_status in (
      'pending_domain_verification',
      'under_review',
      'verified',
      'rejected'
    )
  );

drop index if exists tenants_domain_unique_idx;

-- Domain is permanently reserved only after verification.
create unique index if not exists tenants_domain_verified_unique_idx
  on public.tenants (lower(domain))
  where domain is not null
    and domain_verified = true
    and verification_status = 'verified';

create index if not exists tenants_verification_status_idx
  on public.tenants (verification_status, domain_verified, created_at desc);

create or replace function public.tenant_domain_is_reserved(target_domain text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenants t
    where lower(t.domain) = public.normalize_workspace_domain(target_domain)
      and t.domain_verified = true
      and t.verification_status = 'verified'
  );
$$;

create or replace function public.generate_domain_verification_token()
returns text
language sql
volatile
as $$
  select 'ticxnova-verification=' || replace(gen_random_uuid()::text, '-', '');
$$;

create or replace function public.activate_tenant_domain(
  target_tenant_id uuid,
  target_method text,
  target_approved_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  tenant_row public.tenants%rowtype;
begin
  select * into tenant_row
  from public.tenants
  where id = target_tenant_id
  for update;

  if tenant_row.id is null then
    return jsonb_build_object('success', false, 'message', 'Workspace not found.');
  end if;

  if exists (
    select 1
    from public.tenants t
    where lower(t.domain) = lower(tenant_row.domain)
      and t.domain_verified = true
      and t.verification_status = 'verified'
      and t.id <> target_tenant_id
  ) then
    return jsonb_build_object(
      'success', false,
      'message', 'This domain is already verified by another organization.'
    );
  end if;

  update public.tenants
  set
    domain_verified = true,
    verification_status = 'verified',
    verification_method = coalesce(nullif(trim(target_method), ''), verification_method),
    approved_by = coalesce(target_approved_by, approved_by),
    approved_at = coalesce(approved_at, now()),
    rejected_reason = null,
    is_active = true,
    updated_at = now()
  where id = target_tenant_id;

  return jsonb_build_object(
    'success', true,
    'tenant_id', target_tenant_id,
    'domain', tenant_row.domain,
    'message', 'Domain verified. Workspace is now active.'
  );
end;
$$;

create or replace function public.reject_tenant_verification(
  target_tenant_id uuid,
  target_reason text,
  target_rejected_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tenants
  set
    verification_status = 'rejected',
    domain_verified = false,
    rejected_reason = nullif(trim(coalesce(target_reason, '')), ''),
    approved_by = target_rejected_by,
    approved_at = now(),
    is_active = false,
    updated_at = now()
  where id = target_tenant_id;

  return jsonb_build_object('success', true, 'tenant_id', target_tenant_id);
end;
$$;

-- Patch provision_workspace: pending verification for new workspaces
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
  token_value text;
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

  if public.tenant_domain_is_reserved(domain_name) then
    raise exception 'This organization domain is already verified by another workspace.'
      using errcode = 'unique_violation', detail = 'domain_taken';
  end if;

  token_value := public.generate_domain_verification_token();

  insert into public.tenants (
    company_name,
    domain,
    subscription_plan,
    verification_status,
    domain_verified,
    verification_token,
    verification_requested_at,
    is_active
  )
  values (
    company_name,
    domain_name,
    plan_name,
    'pending_domain_verification',
    false,
    token_value,
    now(),
    true
  )
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

-- Signup: block only permanently verified domains
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
    select 1 from auth.users u where lower(u.email) = normalized_email
  ) or exists (
    select 1 from public.profiles p where lower(p.email) = normalized_email
  ) then
    return jsonb_build_object(
      'available', false,
      'code', 'email_taken',
      'message', 'An account with this email already exists. Sign in instead.'
    );
  end if;

  if public.tenant_domain_is_reserved(normalized_domain) then
    return jsonb_build_object(
      'available', false,
      'code', 'domain_taken',
      'message', 'This organization domain is already verified. Contact your administrator or use a different domain.'
    );
  end if;

  return jsonb_build_object('available', true);
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

  select * into profile_record from public.profiles where id = auth.uid();

  if profile_record.id is null then
    return jsonb_build_object(
      'authenticated', true,
      'has_profile', false,
      'has_tenant', false,
      'domain_verified', false
    );
  end if;

  if profile_record.tenant_id is not null then
    select * into tenant_record from public.tenants where id = profile_record.tenant_id;
  end if;

  return jsonb_build_object(
    'authenticated', true,
    'has_profile', true,
    'has_tenant', profile_record.tenant_id is not null,
    'tenant_id', profile_record.tenant_id,
    'role', profile_record.role,
    'company_name', tenant_record.company_name,
    'domain', tenant_record.domain,
    'subscription_plan', tenant_record.subscription_plan,
    'verification_status', coalesce(tenant_record.verification_status, 'pending_domain_verification'),
    'domain_verified', coalesce(tenant_record.domain_verified, false),
    'verification_method', tenant_record.verification_method,
    'rejected_reason', tenant_record.rejected_reason,
    'can_access_app', coalesce(tenant_record.domain_verified, false)
      and coalesce(tenant_record.verification_status, '') = 'verified'
  );
end;
$$;

create or replace function public.get_my_domain_verification()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  tenant_row public.tenants%rowtype;
  profile_email text;
  email_domain text;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'message', 'Not authenticated.');
  end if;

  select p.email into profile_email
  from public.profiles p
  where p.id = auth.uid();

  select t.* into tenant_row
  from public.profiles p
  join public.tenants t on t.id = p.tenant_id
  where p.id = auth.uid();

  if tenant_row.id is null then
    return jsonb_build_object('success', false, 'message', 'No workspace found.');
  end if;

  email_domain := public.email_domain(profile_email);

  if tenant_row.verification_token is null then
    update public.tenants
    set verification_token = public.generate_domain_verification_token()
    where id = tenant_row.id
    returning verification_token into tenant_row.verification_token;
  end if;

  return jsonb_build_object(
    'success', true,
    'tenant_id', tenant_row.id,
    'company_name', tenant_row.company_name,
    'domain', tenant_row.domain,
    'subscription_plan', tenant_row.subscription_plan,
    'verification_status', tenant_row.verification_status,
    'domain_verified', tenant_row.domain_verified,
    'verification_method', tenant_row.verification_method,
    'verification_token', tenant_row.verification_token,
    'rejected_reason', tenant_row.rejected_reason,
    'admin_email', profile_email,
    'admin_email_matches_domain', email_domain = lower(tenant_row.domain),
    'dns_host', tenant_row.domain,
    'dns_record_type', 'TXT',
    'dns_record_value', tenant_row.verification_token
  );
end;
$$;

create or replace function public.mark_tenant_under_review(target_tenant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'message', 'Not authenticated.');
  end if;

  update public.tenants
  set
    verification_status = 'under_review',
    verification_requested_at = coalesce(verification_requested_at, now()),
    updated_at = now()
  where id = target_tenant_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tenant_id = target_tenant_id
    );

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.get_my_domain_verification() to authenticated;
grant execute on function public.mark_tenant_under_review(uuid) to authenticated;
grant execute on function public.tenant_domain_is_reserved(text) to anon, authenticated;
grant execute on function public.activate_tenant_domain(uuid, text, uuid) to service_role;
grant execute on function public.reject_tenant_verification(uuid, text, uuid) to service_role;
