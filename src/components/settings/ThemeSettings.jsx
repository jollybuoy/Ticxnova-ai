import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const options = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeSettings({ compact = false }) {
  const { preference, setPreference } = useTheme();

  if (compact) {
    return (
      <div className="px-4 py-2">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Theme</p>
        <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-black/20 p-1">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPreference(value)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                preference === value
                  ? 'bg-violet-500/15 text-violet-700 dark:bg-white/10 dark:text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200'
              }`}
              aria-pressed={preference === value}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="glass-card max-w-3xl space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Appearance</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Choose how Ticxnova looks on your device. System follows your OS preference.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            className={`flex flex-col items-center gap-3 rounded-xl border px-4 py-5 text-sm font-medium transition-all ${
              preference === value
                ? 'border-violet-500/40 bg-violet-500/10 text-white shadow-[0_0_0_1px_rgba(124,108,240,0.2)]'
                : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-200'
            }`}
            aria-pressed={preference === value}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                preference === value ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-zinc-400'
              }`}
            >
              <Icon size={20} />
            </span>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
