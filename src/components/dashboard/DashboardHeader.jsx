import { motion } from 'framer-motion';
import { Icon } from '../ui/IconMap';

export function DashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, Admin! Here&apos;s what&apos;s happening with your IT environment.
        </p>
      </div>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02, borderColor: 'rgba(139,92,246,0.4)' }}
        className="flex items-center gap-2 self-start rounded-lg border border-white/10 bg-surface-card/60 px-4 py-2.5 text-sm text-gray-300"
      >
        <Icon name="Calendar" size={16} className="text-gray-500" />
        May 1 – May 31, 2024
      </motion.button>
    </motion.div>
  );
}
