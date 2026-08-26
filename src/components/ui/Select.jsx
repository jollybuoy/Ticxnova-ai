import { ChevronDown } from 'lucide-react';

export function Select({ label, id, options, className = '', children, ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
  const optionList = Array.isArray(options) ? options : [];

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-xs font-medium text-zinc-200">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className="field-control focus-ring w-full appearance-none rounded-xl border py-3 pl-4 pr-10 text-sm transition-all duration-200 hover:border-violet-400/40 focus:border-violet-500/50 disabled:opacity-50"
          {...props}
        >
          {optionList.length > 0
            ? optionList.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-900">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
      </div>
    </div>
  );
}
