import { Card, CardBody } from '../ui/Card';
import { TrendBadge } from './TrendBadge';

export function MetricTile({ label, value, detail, icon: Icon, tone = 'violet', trend = 8, delay = 0 }) {
  const tones = {
    violet: 'from-violet-500/20 to-indigo-500/10 text-violet-200',
    blue: 'from-blue-500/20 to-cyan-500/10 text-blue-200',
    green: 'from-emerald-500/20 to-cyan-500/10 text-emerald-200',
    amber: 'from-amber-500/20 to-orange-500/10 text-amber-200',
    red: 'from-red-500/20 to-rose-500/10 text-red-200',
  };

  return (
    <Card hover={false} delay={delay}>
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
            {detail && <p className="mt-1 text-xs text-zinc-500">{detail}</p>}
          </div>
          {Icon && (
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]}`}>
              <Icon size={22} />
            </div>
          )}
        </div>
        <div className="mt-5">
          <TrendBadge value={trend} positive={trend >= 0} />
        </div>
      </CardBody>
    </Card>
  );
}
