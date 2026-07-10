import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/IconMap';

const alertStyles = {
  success: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  orange: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
};

export function AIInsights({ insights }) {
  const navigate = useNavigate();
  const aiInsights = insights ?? {
    featured: {
      title: 'No ticket trend detected yet',
      description: 'Create tickets and connect devices to unlock operational AI insights.',
      action: 'Open Reports',
    },
    alerts: [],
  };
  return (
    <Card className="h-full min-h-[360px]" delay={0.15}>
      <CardHeader
        title="AI Insights"
        subtitle="Powered by Ticxnova intelligence"
        action={
          <motion.button
            type="button"
            whileHover={{ x: 2 }}
            className="text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
          >
            View all →
          </motion.button>
        }
      />
      <CardBody className="space-y-5">
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-600/25 via-indigo-600/15 to-transparent p-5 shadow-inner shadow-violet-500/10"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/30 ring-1 ring-violet-400/30">
                <Icon name="Sparkles" size={14} className="text-violet-300" />
              </span>
              <span className="text-label normal-case text-violet-300">Featured</span>
            </div>
            <h4 className="text-sm font-semibold leading-snug text-white">
              {aiInsights.featured.title}
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              {aiInsights.featured.description}
            </p>
            <Button variant="primary" className="mt-4 w-full text-xs" onClick={() => navigate('/reports/ai-insights')}>
              {aiInsights.featured.action}
            </Button>
          </div>
        </motion.div>

        <ul className="space-y-2">
          {aiInsights.alerts.map((alert, i) => (
            <motion.li
              key={alert.text}
              initial={false}
              whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)' }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${alertStyles[alert.type]}`}
              >
                <Icon name={alert.icon} size={14} />
              </span>
              <span className="text-xs leading-snug text-zinc-300">{alert.text}</span>
            </motion.li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
