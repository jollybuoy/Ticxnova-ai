import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/20">
        <span className="h-2 w-2 rounded-full bg-violet-300" />
      </div>
      <div className="glass rounded-2xl px-4 py-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-2 w-2 rounded-full bg-zinc-400"
              animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
