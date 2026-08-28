import { Plus } from 'lucide-react';
import { Icon } from '../ui/IconMap';
import { Button } from '../ui/Button';

const ranges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export function DashboardHeader({ greeting, dateRange, onDateRangeChange, onCreateClick }) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{greeting}</h1>
        <p className="mt-2 text-sm text-zinc-400">Here&apos;s what needs your attention today.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="glass flex items-center gap-2.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-zinc-300">
          <Icon name="Calendar" size={16} className="text-zinc-500" />
          <select
            value={dateRange}
            onChange={(event) => onDateRangeChange(event.target.value)}
            className="bg-transparent font-medium text-zinc-200 outline-none"
          >
            {ranges.map((range) => (
              <option key={range.value} value={range.value} className="bg-zinc-900">
                {range.label}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={onCreateClick}>
          <Plus size={16} />
          Create ticket
        </Button>
      </div>
    </header>
  );
}
