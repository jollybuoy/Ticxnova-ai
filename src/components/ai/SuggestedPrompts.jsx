import { motion } from 'framer-motion';

export const suggestedPrompts = [
  'Outlook keeps asking for password',
  'VPN not connecting after password reset',
  'Teams microphone not working',
  'How to setup MFA?',
  'Create a ticket for laptop issue',
];

export function SuggestedPrompts({ onSelect, disabled }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-white">Suggested prompts</p>
        <p className="mt-1 text-xs text-zinc-500">Start with common MSP support scenarios.</p>
      </div>
      <div className="grid gap-2">
        {suggestedPrompts.map((prompt, index) => (
          <motion.button
            key={prompt}
            type="button"
            disabled={disabled}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={disabled ? undefined : { x: 4 }}
            onClick={() => onSelect(prompt)}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-violet-500/30 hover:bg-violet-500/10 disabled:opacity-50"
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
