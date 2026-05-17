export function ChartTooltip({ active, payload, label, valueLabel = 'tickets' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums text-white">
        {payload[0].value}{' '}
        <span className="text-sm font-normal text-zinc-400">{valueLabel}</span>
      </p>
    </div>
  );
}
