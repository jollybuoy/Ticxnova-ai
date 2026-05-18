import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Cloud, ShieldCheck } from 'lucide-react';
import { MarketingLayout } from '../../components/marketing/MarketingLayout';
import { pricingPlans } from '../../components/marketing/marketingData';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAuth } from '../../hooks/useAuth';

const planOptions = pricingPlans.map((plan) => ({ value: plan.name.toLowerCase(), label: plan.name }));

export default function GetStarted() {
  const navigate = useNavigate();
  const { signUp, signInWithMicrosoft, actionLoading } = useAuth();
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    companyName: '',
    domain: '',
    plan: 'starter',
    fullName: '',
    email: '',
    password: '',
  });

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setMessage(null);
    const result = await signUp(form.email, form.password, {
      full_name: form.fullName,
      name: form.fullName,
      company_name: form.companyName,
      domain: form.domain,
      subscription_plan: form.plan,
      role: 'org_admin',
    });

    if (!result.success) {
      setMessage({ type: 'error', text: result.message });
      return;
    }

    if (result.needsEmailConfirmation) {
      setMessage({ type: 'success', text: result.message });
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  return (
    <MarketingLayout>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-28 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Get Started</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">Create your AI IT operations workspace</h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Configure your organization, primary domain, subscription plan, and first org admin using the existing Ticxnova auth foundation.
          </p>
          <div className="mt-8 space-y-4">
            {[
              ['Tenant workspace prepared', Building2],
              ['First org_admin account created', ShieldCheck],
              ['Continue with Microsoft optional', Cloud],
            ].map(([text, Icon]) => (
              <div key={text} className="flex items-center gap-3 text-sm text-zinc-300">
                <Icon size={18} className="text-cyan-300" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company name" value={form.companyName} onChange={update('companyName')} required />
            <Input label="Primary domain" value={form.domain} onChange={update('domain')} placeholder="company.com" required />
            <Select label="Subscription plan" value={form.plan} onChange={update('plan')} options={planOptions} />
            <Input label="Admin full name" value={form.fullName} onChange={update('fullName')} required />
            <Input label="Admin email" type="email" value={form.email} onChange={update('email')} required />
            <Input label="Password" type="password" value={form.password} onChange={update('password')} minLength={6} required />
          </div>

          {message && (
            <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'border-red-400/20 bg-red-500/10 text-red-200'
                : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
            }`}>
              {message.text}
            </p>
          )}

          <Button type="submit" className="mt-6 w-full" loading={actionLoading}>Create Workspace</Button>
          <Button
            type="button"
            variant="microsoft"
            className="mt-3 w-full"
            loading={actionLoading}
            onClick={signInWithMicrosoft}
          >
            <Cloud size={17} />
            Continue with Microsoft
          </Button>
        </form>
      </section>
    </MarketingLayout>
  );
}
