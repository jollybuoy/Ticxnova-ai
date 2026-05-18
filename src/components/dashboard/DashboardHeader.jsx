import { motion } from 'framer-motion';
import { Icon } from '../ui/IconMap';
import { useAuth } from '../../hooks/useAuth';
import { getUserDisplayName } from '../../lib/user';

const ranges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export function DashboardHeader({ dateRange, onDateRangeChange }) {
  const { user } = useAuth();
  const name = getUserDisplayName(user);

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
          Welcome back, {name}. Here&apos;s what&apos;s happening across your IT environment
          today.
        </p>
      </div>
      <motion.label
        whileHover={{ scale: 1.02, borderColor: 'rgba(124,108,240,0.4)' }}
        className="glass focus-ring flex items-center gap-2.5 self-start rounded-xl px-4 py-3 text-sm text-zinc-300 transition-colors duration-200"
      >
        <Icon name="Calendar" size={16} className="text-zinc-500" />
        <select
          value={dateRange}
          onChange={(event) => onDateRangeChange(event.target.value)}
          className="bg-transparent font-medium text-zinc-200 outline-none"
        >
          {ranges.map((range) => (
            <option key={range.value} value={range.value} className="bg-zinc-900">
              {range.label}
            </option>
          ))}
        </select>
      </motion.label>
    </motion.header>
  );
}
