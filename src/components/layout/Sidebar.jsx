import { motion } from 'framer-motion';
import { Icon } from '../ui/IconMap';
import { NavBadge } from '../ui/Badge';
import { navItems } from '../../data/dummyData';

export function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-surface-elevated/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-b border-white/10 px-5 py-5"
        >
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 shadow-lg shadow-purple-500/25">
              <Icon name="Hexagon" size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">Ticxnova-AI</h1>
              <p className="text-[11px] text-gray-500">IT Management Platform</p>
            </div>
          </motion.div>
        </motion.div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {navItems.map((item, i) => (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ x: 2 }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-accent-purple text-white shadow-md shadow-purple-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.badge && <NavBadge count={item.badge} />}
            </motion.button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl border border-white/10 bg-surface-card/60 p-3">
            <motion.div className="mb-2 flex items-center gap-2">
              <Icon name="Bot" size={16} className="text-accent-purple" />
              <span className="text-xs font-semibold text-white">AI Assistant</span>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Online
              </span>
            </motion.div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent text-xs text-gray-300 outline-none placeholder:text-gray-600"
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-accent-purple"
              >
                <Icon name="Send" size={14} />
              </motion.button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
