import { motion } from 'framer-motion';
import { Icon } from '../ui/IconMap';
import { NavBadge } from '../ui/Badge';
import { navItems } from '../../data/dummyData';

export function Sidebar({ open, collapsed, onClose }) {
  const width = collapsed ? 'w-[72px]' : 'w-64';

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex ${width} flex-col border-r border-white/[0.06] glass-strong transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`border-b border-white/[0.06] ${collapsed ? 'px-3 py-4' : 'px-5 py-5'}`}>
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-600/30">
              <Icon name="Hexagon" size={20} className="text-white" />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="min-w-0"
              >
                <h1 className="truncate text-base font-semibold tracking-tight text-white">
                  Ticxnova-AI
                </h1>
                <p className="truncate text-[11px] text-zinc-500">IT Management Platform</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item, i) => (
            <motion.button
              key={item.id}
              type="button"
              title={collapsed ? item.label : undefined}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.025 }}
              whileHover={{ x: collapsed ? 0 : 3, backgroundColor: 'rgba(255,255,255,0.04)' }}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${
                item.active
                  ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/80 text-white shadow-lg shadow-violet-600/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon name={item.icon} size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && <NavBadge count={item.badge} />}
                </>
              )}
              {collapsed && item.badge && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </motion.button>
          ))}
        </nav>

        {!collapsed && (
          <div className="border-t border-white/[0.06] p-4">
            <div className="glass rounded-xl p-3">
              <div className="mb-2 flex items-center gap-2">
                <Icon name="Bot" size={16} className="text-violet-400" />
                <span className="text-xs font-semibold text-white">AI Assistant</span>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent text-xs text-zinc-300 outline-none placeholder:text-zinc-600"
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-violet-400"
                >
                  <Icon name="Send" size={14} />
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
