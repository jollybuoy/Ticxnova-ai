import { TrendingDown, TrendingUp } from 'lucide-react';

export function TrendBadge({ value = 0, positive = true }) {
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
        positive
          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
          : 'border-red-500/25 bg-red-500/10 text-red-300'
      }`}
    >
      <Icon size={13} />
      {value}%
    </span>
  );
}
