import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { useUpgradePlans } from '../components/billing/UpgradePlansModal';

export default function TrialExpired() {
  const { planLabel, trial } = usePlanAccess();
  const { openPlans } = useUpgradePlans();

  useEffect(() => {
    openPlans();
  }, [openPlans]);

  return (
    <div className="mx-auto max-w-xl space-y-8 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-200">
        <Clock size={32} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
          Trial ended
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Subscribe to continue</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-zinc-400">
          Your {planLabel} workspace trial has ended
          {trial.endsAt ? ` on ${new Date(trial.endsAt).toLocaleDateString()}` : ''}. Choose a plan
          to restore access — you will be charged today for the selected plan (CAD, monthly).
        </p>
      </div>

      <Button className="px-8" onClick={openPlans}>
        Choose a plan
      </Button>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/settings/billing"
          className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-300 hover:bg-white/5"
        >
          Billing details
        </Link>
        <Link
          to="/profile"
          className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-300 hover:bg-white/5"
        >
          Account settings
        </Link>
      </div>
    </div>
  );
}
