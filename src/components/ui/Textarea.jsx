export function Textarea({ label, id, className = '', ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-xs font-medium text-zinc-400">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={4}
        className="focus-ring w-full resize-none rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-all duration-200 hover:border-white/15 focus:border-violet-500/40 focus:bg-black/40 disabled:opacity-50"
        {...props}
      />
    </div>
  );
}
