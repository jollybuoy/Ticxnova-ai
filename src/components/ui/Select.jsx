import { ChevronDown } from 'lucide-react';

export function Select({ label, id, options, className = '', ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-xs font-medium text-zinc-400">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className="focus-ring w-full appearance-none rounded-xl border border-white/10 bg-black/25 py-3 pl-4 pr-10 text-sm text-white transition-all duration-200 hover:border-white/15 focus:border-violet-500/40 focus:bg-black/40 disabled:opacity-50"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
      </div>
    </div>
  );
}
