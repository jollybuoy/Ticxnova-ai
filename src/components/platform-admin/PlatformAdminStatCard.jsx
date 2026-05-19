export function PlatformAdminStatCard({ label, value, hint, tone = 'amber' }) {
  const toneClasses =
    tone === 'danger'
      ? 'from-red-500/20 to-red-500/5 text-red-100'
      : tone === 'success'
        ? 'from-emerald-500/20 to-emerald-500/5 text-emerald-100'
        : 'from-amber-500/20 to-amber-500/5 text-amber-100';

  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-br p-5 ${toneClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {hint && <p className="mt-2 text-sm text-zinc-400">{hint}</p>}
    </div>
  );
}
