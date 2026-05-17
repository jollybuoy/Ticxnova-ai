import { motion } from 'framer-motion';
import { Icon } from '../ui/IconMap';

export function TopNavbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-surface-elevated/80 px-4 backdrop-blur-xl lg:px-6">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
        aria-label="Open menu"
      >
        <Icon name="Menu" size={20} />
      </motion.button>

      <motion.div className="relative mx-auto flex max-w-xl flex-1 md:mx-auto">
        <Icon
          name="Search"
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="search"
          placeholder="Search tickets, users, devices..."
          className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
        />
      </motion.div>

      <motion.div
        className="ml-auto flex items-center gap-2 md:gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.05)' }}
          className="hidden rounded-lg p-2 text-gray-400 sm:block"
        >
          <Icon name="HelpCircle" size={20} />
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          className="relative rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
        >
          <Icon name="Bell" size={20} />
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            5
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          className="flex items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-white/10"
        >
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-blue-600 text-xs font-bold text-white"
            whileHover={{ scale: 1.05 }}
          >
            AD
          </motion.div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-[11px] text-gray-500">Super Admin</p>
          </div>
          <Icon name="ChevronDown" size={16} className="hidden text-gray-500 sm:block" />
        </motion.button>
      </motion.div>
    </header>
  );
}
