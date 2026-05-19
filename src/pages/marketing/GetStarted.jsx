import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, Cloud, ShieldCheck } from 'lucide-react';
import { MarketingLayout } from '../../components/marketing/MarketingLayout';
import { pricingPlans } from '../../components/marketing/marketingData';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAuth } from '../../hooks/useAuth';
import {
  checkWorkspaceSignupAvailability,
  finalizeWorkspaceOnboarding,
  getMyWorkspaceStatus,
  getOnboardingErrorMessage,
  isValidWorkspacePlan,
  mapAvailabilityToMessage,
  normalizeWorkspaceDomain,
} from '../../lib/tenant/onboardingService';

const planOptions = pricingPlans.map((plan) => ({
  value: plan.name.toLowerCase(),
  label: plan.name,
}));

const initialForm = {
  companyName: '',
  domain: '',
  plan: 'starter',
  fullName: '',
  email: '',
  password: '',
};

export default function GetStarted() {
  const navigate = useNavigate();
  const { user, isAuthenticated, signUp, signInWithMicrosoft, actionLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  useEffect(() => {
    if (!user) return;
    const metadata = user.user_metadata ?? {};
    setForm((current) => ({
      ...current,
      email: user.email ?? current.email,
      companyName: metadata.company_name ?? current.companyName,
      domain: metadata.domain ?? current.domain,
      plan: metadata.subscription_plan ?? current.plan,
      fullName: metadata.full_name ?? metadata.name ?? current.fullName,
    }));
  }, [user]);

  const validateWorkspaceFields = () => {
    if (!form.companyName.trim()) {
      toast.error('Company name is required.');
      return false;
    }
    if (!normalizeWorkspaceDomain(form.domain)) {
      toast.error('Enter a valid primary domain (for example, company.com).');
      return false;
    }
    if (!isValidWorkspacePlan(form.plan)) {
      toast.error('Choose a valid subscription plan.');
      return false;
    }
    if (!form.fullName.trim()) {
      toast.error('Admin full name is required.');
      return false;
    }
    return true;
  };

  const validateSignupForm = () => {
    if (!validateWorkspaceFields()) return false;
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error('Enter a valid admin email address.');
      return false;
    }
    if (!form.password || form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const completeWorkspaceSetup = async (normalizedDomain) => {
    const provisioned = await finalizeWorkspaceOnboarding({
      companyName: form.companyName,
      domain: normalizedDomain,
      plan: form.plan,
      fullName: form.fullName,
    });

    if (!provisioned.success) {
      toast.error(provisioned.message);
      return false;
    }

    const status = await getMyWorkspaceStatus();
    if (!status.data?.has_tenant) {
      toast.error(
        'Workspace setup could not be verified. Run supabase/workspace-onboarding.sql in the Supabase SQL editor, then try again.',
      );
      return false;
    }

    toast.success(`Welcome to Ticxnova. Your ${form.companyName.trim()} workspace is ready.`);
    navigate('/dashboard', { replace: true });
    return true;
  };

  const submit = async (event) => {
    event.preventDefault();

    setSubmitting(true);

    const normalizedDomain = normalizeWorkspaceDomain(form.domain);

    try {
      if (isAuthenticated) {
        if (!validateWorkspaceFields()) return;
        await completeWorkspaceSetup(normalizedDomain);
        return;
      }

      if (!validateSignupForm()) return;

      const availability = await checkWorkspaceSignupAvailability({
        email: form.email,
        domain: normalizedDomain,
        plan: form.plan,
      });

      const availabilityMessage = mapAvailabilityToMessage(availability);
      if (availabilityMessage) {
        toast.error(availabilityMessage);
        return;
      }

      const result = await signUp(form.email, form.password, {
        workspace_onboarding: 'true',
        company_name: form.companyName.trim(),
        domain: normalizedDomain,
        subscription_plan: form.plan,
        full_name: form.fullName.trim(),
        name: form.fullName.trim(),
        role: 'org_admin',
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      if (result.needsEmailConfirmation || !result.data?.session) {
        toast.success('Account created. Check your email to confirm your account, then sign in.');
        navigate('/login', {
          replace: true,
          state: {
            email: form.email.trim(),
            message:
              'Account created. Confirm your email, then sign in — your workspace will be finalized automatically.',
          },
        });
        return;
      }

      await completeWorkspaceSetup(normalizedDomain);
    } catch (error) {
      toast.error(getOnboardingErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMicrosoft = async () => {
    toast.message('Microsoft sign-in is available for existing workspaces.', {
      description: 'Use the form to create a new organization workspace with email and password.',
    });
    await signInWithMicrosoft();
  };

  const loading = submitting || actionLoading;

  return (
    <MarketingLayout>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-28 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Get Started</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">Create your AI IT operations workspace</h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Provision a secure multi-tenant workspace with your company domain, subscription plan, and first
            organization administrator.
          </p>
          <div className="mt-8 space-y-4">
            {[
              ['Tenant workspace created in Supabase', Building2],
              ['org_admin profile linked to tenant_id', ShieldCheck],
              ['Ready for RBAC, Microsoft login, and feature gating', Cloud],
            ].map(([text, Icon]) => (
              <div key={text} className="flex items-center gap-3 text-sm text-zinc-300">
                <Icon size={18} className="text-cyan-300" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Company name"
              value={form.companyName}
              onChange={update('companyName')}
              required
              disabled={loading}
            />
            <Input
              label="Primary domain"
              value={form.domain}
              onChange={update('domain')}
              placeholder="company.com"
              required
              disabled={loading}
            />
            <Select
              label="Subscription plan"
              value={form.plan}
              onChange={update('plan')}
              options={planOptions}
              disabled={loading}
            />
            <Input
              label="Admin full name"
              value={form.fullName}
              onChange={update('fullName')}
              required
              disabled={loading}
            />
            <Input
              label="Admin email"
              type="email"
              value={isAuthenticated ? user?.email ?? form.email : form.email}
              onChange={update('email')}
              required={!isAuthenticated}
              disabled={loading || isAuthenticated}
            />
            {!isAuthenticated && (
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={update('password')}
                minLength={6}
                required
                disabled={loading}
              />
            )}
          </div>

          <p className="mt-4 text-xs leading-6 text-zinc-500">
            Your workspace is isolated by tenant_id with row-level security. Duplicate domains and emails are
            blocked before provisioning.
          </p>

          {isAuthenticated && (
            <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
              You are signed in. Submit the form below to finish provisioning your workspace.
            </p>
          )}

          <Button type="submit" className="mt-6 w-full" loading={loading} disabled={loading}>
            {isAuthenticated ? 'Complete Workspace Setup' : 'Create Workspace'}
          </Button>
          <Button
            type="button"
            variant="microsoft"
            className="mt-3 w-full"
            disabled={loading}
            onClick={handleMicrosoft}
          >
            <Cloud size={17} />
            Continue with Microsoft
          </Button>
        </form>
      </section>
    </MarketingLayout>
  );
}
