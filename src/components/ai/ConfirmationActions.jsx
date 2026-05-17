import { CheckCircle2, XCircle } from 'lucide-react';

export function ConfirmationActions({ onConfirm, onDismiss, loading, disabled }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onConfirm}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CheckCircle2 size={14} />
        {loading ? 'Creating ticket…' : 'Confirm and create'}
      </button>
      {onDismiss && (
        <button
          type="button"
          disabled={disabled || loading}
          onClick={onDismiss}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <XCircle size={14} />
          Not now
        </button>
      )}
    </div>
  );
}
