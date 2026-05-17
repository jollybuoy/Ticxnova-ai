import { motion } from 'framer-motion';
import { Icon } from '../ui/IconMap';

export function DashboardHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p className="text-label mb-2">Overview</p>
        <h1 className="text-display">Dashboard</h1>
        <p className="text-body mt-2 max-w-xl">
          Welcome back, Admin. Here&apos;s what&apos;s happening across your IT environment today.
        </p>
      </div>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02, borderColor: 'rgba(124,108,240,0.4)' }}
        whileTap={{ scale: 0.98 }}
        className="glass focus-ring flex items-center gap-2.5 self-start rounded-xl px-4 py-3 text-sm text-zinc-300 transition-colors duration-200"
      >
        <Icon name="Calendar" size={16} className="text-zinc-500" />
        <span className="font-medium">May 1 – May 31, 2024</span>
      </motion.button>
    </motion.header>
  );
}
