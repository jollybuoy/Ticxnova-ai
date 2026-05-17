export function Input({ label, id, className = '', ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  const openDatePicker = (event) => {
    if (props.type !== 'date') return;
    try {
      event.currentTarget.showPicker?.();
    } catch {
      // Browser may block showPicker outside a direct user gesture.
    }
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-xs font-medium text-zinc-400">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className="focus-ring w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-all duration-200 hover:border-white/15 focus:border-violet-500/40 focus:bg-black/40"
        {...props}
        onClick={(event) => {
          openDatePicker(event);
          props.onClick?.(event);
        }}
        onFocus={(event) => {
          openDatePicker(event);
          props.onFocus?.(event);
        }}
      />
    </div>
  );
}
