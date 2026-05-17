import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function AuthAlert({ message, variant = 'error', onDismiss }) {
  const styles = {
    error: 'border-red-500/30 bg-red-500/10 text-red-200',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
  };

  const Icon = variant === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles[variant]}`}
          role="alert"
        >
          <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="flex-1 leading-relaxed">{message}</p>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 text-xs opacity-70 transition-opacity hover:opacity-100"
            >
              Dismiss
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
