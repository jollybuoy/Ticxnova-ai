import { UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { AIAvatar, AIMessage } from './AIMessage';

function formatMessageTime(iso) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function ChatMessage({ message, onCreateTicket, creatingTicket }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && <AIAvatar />}

      <div className={`max-w-[min(760px,85%)] ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser ? (
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-3 text-white shadow-lg">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          </div>
        ) : (
          <AIMessage
            message={message}
            onCreateTicket={onCreateTicket}
            creatingTicket={creatingTicket}
          />
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
