import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Icon } from '../ui/IconMap';

export function MetricCard({ metric, index = 0 }) {
  return (
    <Card className="p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <motion.div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${metric.iconBg}`}
          whileHover={{ rotate: 5, scale: 1.08 }}
        >
          <Icon name={metric.icon} className={metric.iconColor} size={20} />
        </motion.div>
        <p className="mt-3 text-xs font-medium text-gray-500">{metric.label}</p>
        <p className="mt-1 text-2xl font-bold text-white">{metric.value}</p>
        <p className={`mt-1 text-xs font-medium ${metric.changeColor}`}>{metric.change}</p>
      </motion.div>
    </Card>
  );
}

export function MetricsGrid({ metrics }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric, i) => (
        <MetricCard key={metric.id} metric={metric} index={i} />
      ))}
    </div>
  );
}
