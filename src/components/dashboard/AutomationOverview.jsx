import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Card } from '../ui/Card';
import { automation } from '../../data/dummyData';

export function AutomationOverview() {
  const stats = [
    { label: 'Active Workflows', value: automation.activeWorkflows },
    { label: 'Workflows Executed Today', value: automation.executedToday },
    { label: 'Success Rate', value: automation.successRate },
  ];

  return (
    <Card className="mt-6 p-5" hover={false}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Automation Overview</h3>
          <div className="mt-3 flex flex-wrap gap-6">
            {stats.map((stat) => (
              <motion.div key={stat.label} whileHover={{ scale: 1.02 }}>
                <span className="text-lg font-bold text-white">{stat.value}</span>
                <span className="ml-2 text-xs text-gray-500">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02, borderColor: 'rgba(139,92,246,0.4)' }}
          className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
        >
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Next Workflow
            </p>
            <p className="text-sm font-semibold text-white">
              {automation.nextWorkflow.name}{' '}
              <span className="font-normal text-gray-400">{automation.nextWorkflow.time}</span>
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-purple shadow-lg shadow-purple-500/30"
          >
            <Play size={16} className="ml-0.5 fill-white text-white" />
          </motion.button>
        </motion.div>
      </div>
    </Card>
  );
}
