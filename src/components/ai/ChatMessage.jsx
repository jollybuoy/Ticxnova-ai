import { Link } from 'react-router-dom';
import { Bot, UserRound, TicketPlus } from 'lucide-react';
import { motion } from 'framer-motion';

function formatMessageTime(iso) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20">
          <Bot size={18} />
        </div>
      )}

      <div className={`max-w-[min(760px,85%)] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl border px-4 py-3 shadow-lg ${
            isUser
              ? 'border-violet-500/30 bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
              : message.isError
                ? 'border-red-500/25 bg-red-500/10 text-red-100'
                : 'glass-card text-zinc-200'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        </div>

        {message.shouldCreateTicket && (
          <div className="mt-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              <TicketPlus size={18} className="mt-0.5 text-blue-300" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Would you like me to create a support ticket?
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  I can route this to your IT queue for follow-up.
                </p>
                <Link
                  to="/tickets"
                  className="mt-3 inline-flex rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-400"
                >
                  Open tickets
                </Link>
              </div>
            </div>
          </div>
        )}

        <p className={`mt-1 text-[11px] text-zinc-600 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatMessageTime(message.createdAt)}
        </p>
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-200 ring-1 ring-white/10">
          <UserRound size={18} />
        </div>
      )}
    </motion.div>
  );
}
