import { useEffect, useState } from 'react';
import { Building2, Palette, ShieldCheck, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { useTenant } from '../../hooks/useTenant';
import { getTenantErrorMessage, uploadTenantLogo } from '../../lib/tenant/tenantService';

const subscriptionOptions = [
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

export default function OrganizationSettings() {
  const { tenant, profile, loading, mutating, saveTenant, saveProfile } = useTenant();
  const [form, setForm] = useState({
    company_name: '',
    domain: '',
    subscription_plan: 'starter',
    brand_color: '#7c3aed',
    logo_url: '',
    full_name: '',
    department: '',
  });
  const [uploading, setUploading] = useState(false);
  const [domainDeleteOpen, setDomainDeleteOpen] = useState(false);

  useEffect(() => {
    if (!tenant && !profile) return;
    const task = window.setTimeout(() => {
      setForm({
        company_name: tenant?.company_name ?? '',
        domain: tenant?.domain ?? '',
        subscription_plan: tenant?.subscription_plan ?? 'starter',
        brand_color: tenant?.brand_color ?? '#7c3aed',
        logo_url: tenant?.logo_url ?? '',
        full_name: profile?.full_name ?? '',
        department: profile?.department ?? '',
      });
    }, 0);
    return () => window.clearTimeout(task);
  }, [profile, tenant]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !tenant?.id) return;
    setUploading(true);
    const { data, error } = await uploadTenantLogo(tenant.id, file);
    setUploading(false);
    if (error) {
      toast.error(getTenantErrorMessage(error));
      return;
    }
    updateField('logo_url', data);
    toast.success('Logo uploaded');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await saveTenant({
      company_name: form.company_name.trim(),
      domain: form.domain.trim().toLowerCase() || null,
      subscription_plan: form.subscription_plan,
      brand_color: form.brand_color,
      logo_url: form.logo_url.trim() || null,
    });
    await saveProfile({
      full_name: form.full_name.trim() || null,
      department: form.department.trim() || null,
    });
  };

  const handleRemoveDomain = async () => {
    const result = await saveTenant({ domain: null });
    if (result.success) {
      updateField('domain', '');
      setDomainDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="glass-card flex min-h-[420px] items-center justify-center">
          <Spinner className="h-6 w-6 text-violet-300" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">
            Tenant Administration
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Organization Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Manage tenant identity, domain mapping, branding, and your admin profile.
          </p>
        </div>
        <div className="glass-card inline-flex items-center gap-3 px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
          <span className="text-sm text-zinc-300">Tenant isolated by Supabase RLS</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-card space-y-5 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3 text-violet-200">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Company Profile</h2>
              <p className="text-sm text-zinc-400">Used across tickets, reports, and AI context.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Company Name"
              value={form.company_name}
              onChange={(event) => updateField('company_name', event.target.value)}
              required
            />
            <div>
              <Input
                label="Domain"
                value={form.domain}
                onChange={(event) => updateField('domain', event.target.value)}
                placeholder="example.com"
              />
              {tenant?.domain && (
                <button
                  type="button"
                  onClick={() => setDomainDeleteOpen(true)}
                  className="mt-2 text-xs font-medium text-red-300 transition-colors hover:text-red-200"
                >
                  Remove added domain
                </button>
              )}
            </div>
            <Select
              label="Subscription Plan"
              value={form.subscription_plan}
              onChange={(event) => updateField('subscription_plan', event.target.value)}
              options={subscriptionOptions}
            />
            <Input
              label="Admin Department"
              value={form.department}
              onChange={(event) => updateField('department', event.target.value)}
              placeholder="IT Operations"
            />
            <Input
              label="Admin Full Name"
              value={form.full_name}
              onChange={(event) => updateField('full_name', event.target.value)}
              className="md:col-span-2"
            />
          </div>
        </section>

        <section className="glass-card space-y-5 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-3 text-fuchsia-200">
              <Palette size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Branding</h2>
              <p className="text-sm text-zinc-400">Logo and color tokens for the tenant workspace.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10"
                style={{ backgroundColor: form.brand_color }}
              >
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Organization logo" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-7 w-7 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{form.company_name || 'Your Company'}</p>
                <p className="text-xs text-zinc-400">{form.subscription_plan} plan</p>
              </div>
            </div>
          </div>

          <Input
            label="Brand Color"
            type="color"
            value={form.brand_color}
            onChange={(event) => updateField('brand_color', event.target.value)}
          />
          <Input
            label="Logo URL"
            value={form.logo_url}
            onChange={(event) => updateField('logo_url', event.target.value)}
            placeholder="https://..."
          />
          <label className="focus-ring flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-white/[0.06]">
            <UploadCloud size={17} />
            {uploading ? 'Uploading logo...' : 'Upload logo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>

          <Button type="submit" className="w-full" loading={mutating || uploading}>
            Save Organization Settings
          </Button>
        </section>
      </form>

      <Modal
        open={domainDeleteOpen}
        onClose={() => setDomainDeleteOpen(false)}
        title="Remove organization domain?"
        description="This is a sensitive tenant security setting."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100/90">
            Removing the domain will stop new user invitations from being validated against your
            company domain until a new domain is added. Existing users are not deleted, but bulk
            invites will be blocked until the domain is configured again.
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
            Current domain: <span className="font-semibold text-white">{tenant?.domain}</span>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setDomainDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="border-red-400/20 bg-gradient-to-r from-red-600 to-rose-600 shadow-red-600/20 hover:shadow-red-600/30"
              loading={mutating}
              onClick={handleRemoveDomain}
            >
              Confirm Remove Domain
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
