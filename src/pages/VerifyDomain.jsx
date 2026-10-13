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
  ListOrdered,
} from 'lucide-react';
import { toast } from 'sonner';
import { BackgroundMesh } from '../components/layout/BackgroundMesh';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { useTenant } from '../hooks/useTenant';
import {
  fetchMyDomainVerification,
  getRecommendedVerificationPath,
  getVerificationStatusLabel,
  requestDomainReview,
  verifyDomainBusinessEmail,
  verifyDomainDns,
  workspaceCanAccessApp,
} from '../lib/tenant/verificationService';

function CopyField({ label, value, hint }) {
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      <div className="mt-2 flex items-center justify-between gap-3">
        <code className="break-all text-sm text-cyan-100">{value}</code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-xl border border-white/10 p-2 text-zinc-400 hover:text-white"
          aria-label={`Copy ${label}`}
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
}

function Step({ n, children }) {
  return (
    <li className="flex gap-3 text-sm leading-6 text-zinc-400">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function VerifyDomain() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { tenant, refetch } = useTenant();
  const { trial } = usePlanAccess();
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
    toast.message(data?.message || 'TXT record not found yet. Wait a few minutes and try again.');
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
  const isUnderReview = status === 'under_review';
  const recommended = getRecommendedVerificationPath({
    adminEmailMatchesDomain: Boolean(info?.admin_email_matches_domain),
    status,
  });

  return (
    <div className="app-theme relative min-h-screen overflow-hidden">
      <BackgroundMesh variant="login" />

      <div className="relative mx-auto max-w-6xl px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-violet-600/30">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">
            Step 2 of 3 · Domain verification
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Prove you own this organization
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            Your workspace is created. Unlock tickets, devices, reports, and AI by verifying the
            company domain. After that you can choose a plan.
          </p>
        </motion.div>

        <ol className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            ['1', 'Create account', 'Done — your login is ready.'],
            ['2', 'Verify domain', 'You are here. Pick one method below.'],
            ['3', 'Start trial', 'Add a card after verification. No charge for 7 days if you are still on trial.'],
          ].map(([n, title, detail]) => (
            <li
              key={n}
              className={`glass-card flex gap-3 p-4 ${n === '2' ? 'ring-1 ring-cyan-400/40' : ''}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                {n}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{detail}</p>
              </div>
            </li>
          ))}
        </ol>

        {loading && (
          <div className="glass-card p-8 text-center text-sm text-zinc-400">Loading verification details...</div>
        )}

        {!loading && info && (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
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
                      isRejected ? 'text-red-300' : isUnderReview ? 'text-amber-200' : 'text-amber-200'
                    }`}
                  >
                    {getVerificationStatusLabel(status)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
                <p>
                  <span className="text-zinc-200">Signed-in email:</span> {info.admin_email}
                </p>
                <p className="mt-2">
                  <span className="text-zinc-200">Plan selected:</span>{' '}
                  <span className="capitalize">{info.subscription_plan}</span>
                </p>
                {isRejected && info.rejected_reason && (
                  <p className="mt-3 text-red-200">{info.rejected_reason}</p>
                )}
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-cyan-100">
                  <ListOrdered size={16} />
                  <p className="text-sm font-semibold">Recommended next step</p>
                </div>
                <p className="text-sm leading-6 text-zinc-300">
                  {recommended === 'email' &&
                    `Your email already matches @${info.domain}. Use “Verify with business email” — it is instant.`}
                  {recommended === 'dns' &&
                    `You signed in with ${info.admin_email}, which is not @${info.domain}. Add the DNS TXT record below (or sign in later with a work inbox at that domain).`}
                  {recommended === 'review' &&
                    'Your request is with the Ticxnova team. Keep this page bookmarked — we will unlock the workspace after review. You can still try DNS while you wait.'}
                </p>
              </div>

              <p className="text-xs leading-6 text-zinc-500">
                Gmail, Outlook, and other public inboxes can create the account, but they cannot prove
                company ownership by themselves. Until this domain is verified, it is not reserved — so
                complete DNS or request review if you do not manage DNS.
              </p>

              {tenant?.subscription_status === 'trialing' && !trial.isExpired && (
                <p className="text-xs leading-6 text-cyan-200/90">
                  After verification you will add a payment method for the 7-day trial. You are not
                  charged unless you stay subscribed
                  {trial.endsAt ? ` (trial ends ${new Date(trial.endsAt).toLocaleDateString()})` : ''}.
                </p>
              )}

              <Button type="button" variant="secondary" className="w-full" onClick={() => signOut()}>
                Sign out
              </Button>
            </section>

            <section className="space-y-4">
              <article
                className={`glass-card p-6 ${recommended === 'dns' ? 'ring-1 ring-cyan-400/30' : ''}`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <Globe className="text-cyan-300" size={20} />
                  <h3 className="text-lg font-semibold text-white">Option A · DNS TXT record</h3>
                </div>
                <p className="text-sm leading-7 text-zinc-400">
                  This is the usual method. You need access to DNS for{' '}
                  <span className="text-white">{info.domain}</span> (GoDaddy, Cloudflare, Namecheap,
                  Google Domains, or your IT provider).
                </p>
                <ol className="mt-4 space-y-3">
                  <Step n="1">
                    Sign in to the site where you registered <span className="text-white">{info.domain}</span>.
                  </Step>
                  <Step n="2">Open DNS, DNS management, or DNS records.</Step>
                  <Step n="3">
                    Add a new record of type <span className="text-white">TXT</span>.
                  </Step>
                  <Step n="4">
                    Paste the host and value below. If the form asks for a name on the root domain, use{' '}
                    <span className="text-white">@</span>.
                  </Step>
                  <Step n="5">Save, wait 2–15 minutes (sometimes up to 24 hours), then check below.</Step>
                </ol>
                <div className="mt-4 space-y-3">
                  <CopyField
                    label="Host / name"
                    value={info.dns_host}
                    hint="If your provider rejects the full domain, try @"
                  />
                  <CopyField label="TXT value" value={info.dns_record_value} hint="Paste the whole value, including ticxnova-verification=" />
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

              <article
                className={`glass-card p-6 ${recommended === 'email' ? 'ring-1 ring-violet-400/30' : ''}`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <Mail className="text-violet-300" size={20} />
                  <h3 className="text-lg font-semibold text-white">Option B · Work email</h3>
                </div>
                {info.admin_email_matches_domain ? (
                  <p className="text-sm leading-7 text-zinc-400">
                    You are signed in as <span className="text-white">{info.admin_email}</span>, which
                    matches this domain. Click once to verify instantly — no DNS needed.
                  </p>
                ) : (
                  <p className="text-sm leading-7 text-zinc-400">
                    This only works with an inbox at <span className="text-white">@{info.domain}</span>
                    . Gmail and other public emails stay locked. Create or sign in with something like{' '}
                    <span className="text-white">it@{info.domain}</span>, or use DNS instead.
                  </p>
                )}
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

              <article
                className={`glass-card p-6 ${recommended === 'review' ? 'ring-1 ring-amber-400/30' : ''}`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <Headphones className="text-amber-300" size={20} />
                  <h3 className="text-lg font-semibold text-white">Option C · Ask Ticxnova to review</h3>
                </div>
                <p className="text-sm leading-7 text-zinc-400">
                  {isUnderReview
                    ? 'Already submitted. Super Admin will see this under Domain approvals. You do not need to submit again unless you were asked to.'
                    : 'Use this if you do not manage DNS (for example an IT partner has to add the record). It appears in Super Admin → Domain approvals. This is not instant.'}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-5 w-full"
                  loading={checking}
                  disabled={isUnderReview}
                  onClick={runSupportReview}
                >
                  {isUnderReview ? 'Review requested' : 'Request platform review'}
                </Button>
                <p className="mt-3 text-xs text-zinc-500">
                  Questions: <span className="text-zinc-300">ticxnova-ai@jollybuoy.com</span>
                </p>
              </article>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
