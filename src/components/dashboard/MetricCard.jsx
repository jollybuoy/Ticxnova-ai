import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Icon } from '../ui/IconMap';

export function MetricCard({ metric, index = 0 }) {
  const navigate = useNavigate();
  return (
    <Card
      className={`group p-6 ${metric.href ? 'cursor-pointer' : ''}`}
      delay={index * 0.06}
      role={metric.href ? 'button' : undefined}
      tabIndex={metric.href ? 0 : undefined}
      onClick={() => metric.href && navigate(metric.href)}
      onKeyDown={(event) => {
        if (metric.href && (event.key === 'Enter' || event.key === ' ')) navigate(metric.href);
      }}
    >
      <div>
        <motion.div
          className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${metric.iconBg} ring-1 ring-white/10`}
          whileHover={{ scale: 1.08, rotate: 4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Icon name={metric.icon} className={metric.iconColor} size={22} />
        </motion.div>
        <p className="text-label">{metric.label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-white tabular-nums">
          {metric.value}
        </p>
        <p className={`mt-2 text-xs font-medium ${metric.changeColor}`}>{metric.change}</p>
      </div>
    </Card>
  );
}

export function MetricsGrid({ metrics }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric, i) => (
        <MetricCard key={metric.id} metric={metric} index={i} />
      ))}
    </div>
  );
}
