import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Spinner } from '../ui/Spinner';

function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString();
}

export function NotificationDropdown({ open, onClose, notifications, unreadCount, loading, mutating, markRead, markAllRead }) {
  const navigate = useNavigate();

  const handleClick = async (item) => {
    if (!item.read_at) {
      await markRead(item.id);
    }
    const path = item.metadata?.path;
    if (path) {
      navigate(path);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-white/10 glass-strong shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-xs text-zinc-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={mutating}
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-violet-300 hover:bg-white/5"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex justify-center py-10">
                <Spinner className="h-6 w-6 text-violet-400" />
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Bell size={28} className="text-zinc-600" />
                <p className="text-sm text-zinc-400">No notifications yet</p>
                <p className="text-xs text-zinc-600">Ticket and trial alerts will appear here.</p>
              </div>
            )}
            {!loading &&
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleClick(item)}
                  className={`w-full border-b border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ${
                    item.read_at ? 'opacity-70' : 'bg-violet-500/[0.04]'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  {item.body && <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{item.body}</p>}
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                    {formatTime(item.created_at)}
                  </p>
                </button>
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function NotificationBellButton({ open, onToggle, unreadCount }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06 }}
      onClick={onToggle}
      className="relative rounded-xl p-2.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
      aria-label="Notifications"
      aria-expanded={open}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </motion.button>
  );
}
