import { motion } from 'framer-motion';
import { Icon } from '../ui/IconMap';

export function TopNavbar({ onMenuClick, collapsed, onToggleCollapse }) {
  return (
    <header className="sticky top-0 z-30 flex h-[4.25rem] items-center gap-4 border-b border-white/[0.06] glass px-4 lg:px-6">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onMenuClick}
        className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
        aria-label="Open menu"
      >
        <Icon name="Menu" size={20} />
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleCollapse}
        className="hidden rounded-xl p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white lg:flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Icon name={collapsed ? 'PanelLeft' : 'PanelLeftClose'} size={20} />
      </motion.button>

      <div className="relative mx-auto hidden max-w-2xl flex-1 md:block">
        <Icon
          name="Search"
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="search"
          placeholder="Search tickets, users, devices..."
          className="focus-ring w-full rounded-xl border border-white/[0.08] bg-black/30 py-2.5 pl-11 pr-4 text-sm text-zinc-200 transition-all duration-200 placeholder:text-zinc-600 hover:border-white/12 focus:border-violet-500/30 focus:bg-black/40"
        />
      </div>

      <motion.div
        className="ml-auto flex items-center gap-1 sm:gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.06, backgroundColor: 'rgba(255,255,255,0.06)' }}
          className="hidden rounded-xl p-2.5 text-zinc-400 sm:block"
        >
          <Icon name="HelpCircle" size={20} />
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          className="relative rounded-xl p-2.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Icon name="Bell" size={20} />
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#0c1019]">
            5
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 transition-all duration-200 hover:border-white/10"
        >
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-xs font-semibold text-white ring-2 ring-white/10"
            whileHover={{ scale: 1.06 }}
          >
            AD
          </motion.div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-[11px] text-zinc-500">Super Admin</p>
          </div>
          <Icon name="ChevronDown" size={16} className="hidden text-zinc-500 sm:block" />
        </motion.button>
      </motion.div>
    </header>
  );
}
