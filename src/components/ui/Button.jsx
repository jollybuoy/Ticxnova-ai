import { motion } from 'framer-motion';
import { Spinner } from './Spinner';

const variants = {
  primary:
    'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 border border-white/10',
  secondary:
    'glass text-zinc-200 hover:bg-white/[0.08] border border-white/10',
  ghost: 'text-zinc-400 hover:text-white hover:bg-white/5',
  microsoft:
    'glass-strong text-white hover:bg-white/[0.08] border border-white/10',
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  loading = false,
  disabled = false,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.01, y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </motion.button>
  );
}
