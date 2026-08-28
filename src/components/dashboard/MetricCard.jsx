import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Icon } from '../ui/IconMap';
import { Sparkline } from '../ui/Sparkline';

export function MetricCard({ metric }) {
  const navigate = useNavigate();
  return (
    <Card
      hover={false}
      className={`p-5 ${metric.href ? 'cursor-pointer' : ''}`}
      role={metric.href ? 'button' : undefined}
      tabIndex={metric.href ? 0 : undefined}
      onClick={() => metric.href && navigate(metric.href)}
      onKeyDown={(event) => {
        if (metric.href && (event.key === 'Enter' || event.key === ' ')) navigate(metric.href);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 ${metric.iconBg}`}>
          <Icon name={metric.icon} className={metric.iconColor} size={18} />
        </span>
        <Sparkline values={metric.spark} color={metric.color} />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">{metric.label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-white">{metric.value}</p>
      <p
        className={`mt-2 text-xs font-medium ${
          metric.trend.good ? 'text-emerald-300' : metric.trend.good === false ? 'text-red-300' : 'text-zinc-500'
        }`}
      >
        {metric.trend.text}
      </p>
    </Card>
  );
}

export function MetricsGrid({ metrics }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
