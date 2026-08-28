import { Sparkles } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { RingGauge } from '../ui/RingGauge';

const toneDot = {
  red: 'bg-red-500',
  orange: 'bg-orange-400',
  yellow: 'bg-amber-400',
  green: 'bg-emerald-400',
  blue: 'bg-blue-400',
};

export function AiInsightPanel({
  title = 'AI intelligence',
  subtitle = 'What to act on next',
  gauges = [],
  alerts = [],
  cta = 'Review recommendations',
  onCta,
}) {
  return (
    <Card hover={false} className="border-violet-400/20 p-0">
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={<Sparkles size={16} className="text-violet-300" />}
      />
      <CardBody className="space-y-5">
        {gauges.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {gauges.map((gauge) => (
              <RingGauge
                key={gauge.label}
                value={gauge.value}
                max={gauge.max ?? 100}
                display={gauge.display}
                color={gauge.color}
                label={gauge.label}
                size={76}
                stroke={7}
              />
            ))}
          </div>
        )}
        {alerts.length > 0 && (
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li key={alert.id || alert.label} className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-zinc-300">
                  <span className={`h-1.5 w-1.5 rounded-full ${toneDot[alert.tone] || 'bg-zinc-400'}`} />
                  {alert.label}
                </span>
                <span className="tabular-nums text-white">{alert.value}</span>
              </li>
            ))}
          </ul>
        )}
        {onCta && (
          <Button className="w-full" onClick={onCta}>
            <Sparkles size={16} />
            {cta}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
