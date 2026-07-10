import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';

export function AutomationOverview({ automation }) {
  const navigate = useNavigate();
  const liveAutomation = automation ?? {
    activeWorkflows: 0,
    executedToday: 0,
    successRate: '100%',
    nextWorkflow: { name: 'No queued workflow', time: 'all clear' },
  };
  const stats = [
    { label: 'Service Requests', value: liveAutomation.activeWorkflows },
    { label: 'Created Today', value: liveAutomation.executedToday },
    { label: 'Resolution Rate', value: liveAutomation.successRate },
  ];

  return (
    <Card className="p-6 lg:p-7" hover={false} delay={0.3}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white">Automation Overview</h3>
          <p className="mt-1 text-xs text-zinc-500">Workflow health at a glance</p>
          <div className="mt-5 flex flex-wrap gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={false}
                whileHover={{ y: -2 }}
              >
                <p className="text-2xl font-semibold tracking-tight text-white tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02, borderColor: 'rgba(124,108,240,0.35)' }}
          className="glass flex items-center gap-5 rounded-2xl px-5 py-4"
        >
          <div>
            <p className="text-label">Next Workflow</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {liveAutomation.nextWorkflow.name}
              <span className="ml-1 font-normal text-zinc-400">
                {liveAutomation.nextWorkflow.time}
              </span>
            </p>
          </div>
          <motion.button
            type="button"
            onClick={() => navigate('/tickets?type=service_request')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/30 ring-1 ring-white/20"
          >
            <Play size={18} className="ml-0.5 fill-white text-white" />
          </motion.button>
        </motion.div>
      </div>
    </Card>
  );
}
