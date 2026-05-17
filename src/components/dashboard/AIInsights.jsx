import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Icon } from '../ui/IconMap';
import { aiInsights } from '../../data/dummyData';

const alertStyles = {
  success: 'text-green-400',
  warning: 'text-yellow-400',
  orange: 'text-orange-400',
};

export function AIInsights() {
  return (
    <Card className="h-full min-h-[320px]">
      <CardHeader
        title="AI Insights"
        action={
          <motion.button
            type="button"
            whileHover={{ color: '#a78bfa' }}
            className="text-xs font-medium text-accent-purple"
          >
            View all
          </motion.button>
        }
      />
      <CardBody className="space-y-4">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-violet-600/10 p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <Icon name="Sparkles" size={16} className="text-accent-purple" />
            <span className="text-xs font-semibold text-purple-300">Featured Insight</span>
          </div>
          <h4 className="text-sm font-semibold text-white">{aiInsights.featured.title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">
            {aiInsights.featured.description}
          </p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="mt-3 rounded-lg bg-accent-purple px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-purple-500/25"
          >
            {aiInsights.featured.action}
          </motion.button>
        </motion.div>

        <ul className="space-y-3">
          {aiInsights.alerts.map((alert, i) => (
            <motion.li
              key={alert.text}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ x: 4 }}
              className="flex items-start gap-2.5 text-xs text-gray-300"
            >
              <Icon
                name={alert.icon}
                size={14}
                className={`mt-0.5 shrink-0 ${alertStyles[alert.type]}`}
              />
              <span>{alert.text}</span>
            </motion.li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
