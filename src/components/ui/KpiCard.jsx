import { Card } from './Card';
import { Sparkline } from './Sparkline';

export function KpiCard({
  icon: Icon,
  iconBg = 'bg-violet-500/15 text-violet-300',
  label,
  value,
  hint,
  spark,
  color = '#8b5cf6',
  onClick,
}) {
  return (
    <Card
      hover={false}
      className={`p-5 ${onClick ? 'cursor-pointer' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) onClick();
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 ${iconBg}`}>
          {Icon && <Icon size={18} />}
        </span>
        {spark ? <Sparkline values={spark} color={color} /> : null}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
      {hint && <p className="mt-2 text-xs text-zinc-400">{hint}</p>}
    </Card>
  );
}
