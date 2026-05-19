import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  Copy,
  Globe,
  Mail,
  RefreshCw,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import { toast } from 'sonner';
import { BackgroundMesh } from '../components/layout/BackgroundMesh';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import {
  fetchMyDomainVerification,
  getVerificationStatusLabel,
  requestDomainReview,
  verifyDomainBusinessEmail,
  verifyDomainDns,
  workspaceCanAccessApp,
} from '../lib/tenant/verificationService';

function CopyField({ label, value }) {
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <code className="break-all text-sm text-cyan-100">{value}</code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-xl border border-white/10 p-2 text-zinc-400 hover:text-white"
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
}

export default function VerifyDomain() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { tenant, refetch } = useTenant();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchMyDomainVerification();
    if (error) {
      toast.error(error.message || 'Unable to load verification details.');
    }
    setInfo(data?.success ? data : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (workspaceCanAccessApp(tenant)) {
      navigate('/dashboard', { replace: true });
    }
  }, [tenant, navigate]);

  const runDnsCheck = async () => {
    setChecking(true);
    const { data, error } = await verifyDomainDns();
    setChecking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data?.verified) {
      toast.success(data.message);
      await refetch();
      navigate('/dashboard', { replace: true });
      return;
    }
    toast.message(data?.message || 'DNS record not detected yet.');
    await load();
  };

  const runBusinessEmail = async () => {
    setChecking(true);
    const { data, error } = await verifyDomainBusinessEmail();
    setChecking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data?.verified) {
      toast.success(data.message);
      await refetch();
      navigate('/dashboard', { replace: true });
      return;
    }
    toast.error(data?.message || 'Business email verification failed.');
  };

  const runSupportReview = async () => {
    setChecking(true);
    const { data, error } = await requestDomainReview();
    setChecking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(data?.message || 'Submitted for review.');
    await load();
  };

  const status = info?.verification_status ?? tenant?.verification_status;
  const isRejected = status === 'rejected';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundMesh variant="login" />

      <div className="relative mx-auto max-w-5xl px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-violet-600/30">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">
            Workspace activation
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Verify your organization domain
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            Your account is active. Complete domain verification to unlock tickets, devices, reports,
            and the AI assistant for your workspace.
          </p>
        </motion.div>

        {loading && (
          <div className="glass-card p-8 text-center text-sm text-zinc-400">Loading verification details...</div>
        )}

        {!loading && info && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <section className="glass-card space-y-5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-cyan-300">
                  <Building2 size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{info.company_name}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{info.domain}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.25em] text-zinc-500">Status</p>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      isRejected ? 'text-red-300' : 'text-amber-200'
                    }`}
                  >
                    {getVerificationStatusLabel(status)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
                <p>
                  <span className="text-zinc-200">Admin email:</span> {info.admin_email}
                </p>
                <p className="mt-2">
                  <span className="text-zinc-200">Plan:</span>{' '}
                  <span className="capitalize">{info.subscription_plan}</span>
                </p>
                {isRejected && info.rejected_reason && (
                  <p className="mt-3 text-red-200">{info.rejected_reason}</p>
                )}
              </div>

              <p className="text-xs leading-6 text-zinc-500">
                Until verified, your domain is not permanently reserved. This prevents fake or abandoned
                registrations from blocking legitimate organizations.
              </p>

              <Button type="button" variant="secondary" className="w-full" onClick={() => signOut()}>
                Sign out
              </Button>
            </section>

            <section className="space-y-4">
              <article className="glass-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Globe className="text-cyan-300" size={20} />
                  <h3 className="text-lg font-semibold text-white">DNS TXT verification</h3>
                </div>
                <p className="text-sm leading-7 text-zinc-400">
                  Add this TXT record to <span className="text-white">{info.domain}</span> at your DNS
                  provider, then run the check.
                </p>
                <div className="mt-4 space-y-3">
                  <CopyField label="Host" value={info.dns_host} />
                  <CopyField label="TXT value" value={info.dns_record_value} />
                </div>
                <Button
                  type="button"
                  className="mt-5 w-full"
                  loading={checking}
                  onClick={runDnsCheck}
                >
                  <RefreshCw size={16} />
                  Check DNS record
                </Button>
              </article>

              <article className="glass-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Mail className="text-violet-300" size={20} />
                  <h3 className="text-lg font-semibold text-white">Business email verification</h3>
                </div>
                <p className="text-sm leading-7 text-zinc-400">
                  {info.admin_email_matches_domain
                    ? 'Your signed-in email matches this organization domain. Verify instantly.'
                    : `Use an email address at @${info.domain} to verify ownership.`}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-5 w-full"
                  loading={checking}
                  disabled={!info.admin_email_matches_domain}
                  onClick={runBusinessEmail}
                >
                  <CheckCircle2 size={16} />
                  Verify with business email
                </Button>
              </article>

              <article className="glass-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Headphones className="text-amber-300" size={20} />
                  <h3 className="text-lg font-semibold text-white">Platform review</h3>
                </div>
                <p className="text-sm leading-7 text-zinc-400">
                  Need help? Submit your workspace for manual review by the Ticxnova platform team.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-5 w-full"
                  loading={checking}
                  onClick={runSupportReview}
                >
                  Request platform review
                </Button>
              </article>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
