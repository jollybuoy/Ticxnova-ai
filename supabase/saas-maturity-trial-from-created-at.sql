-- Re-anchor trial to workspace created_at (7 days from account creation).
-- Run if you already applied an older saas-maturity.sql that used now() for trial dates.

update public.tenants t
set
  trial_started_at = t.created_at,
  trial_ends_at = t.created_at + interval '7 days'
where t.trial_started_at is distinct from t.created_at
   or t.trial_ends_at is distinct from t.created_at + interval '7 days'
   or t.trial_started_at is null
   or t.trial_ends_at is null;

-- Re-deploy provision_workspace + get_tenant_subscription_state from saas-maturity.sql
