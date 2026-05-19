import { Link } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { usePlanAccess } from '../hooks/usePlanAccess';

export default function TrialExpired() {
  const { planLabel, trial } = usePlanAccess();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-200">
          <Clock size={32} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
          Trial ended
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Upgrade to continue</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          Your {planLabel} workspace trial has ended
          {trial.endsAt ? ` on ${new Date(trial.endsAt).toLocaleDateString()}` : ''}. Subscribe to
          restore full access to tickets, devices, reports, and AI workflows.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/settings/billing"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-600/25 hover:opacity-95"
          >
            <Sparkles size={16} />
            View plans & upgrade
          </Link>
          <Link
            to="/profile"
            className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-300 hover:bg-white/5"
          >
            Account settings
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
