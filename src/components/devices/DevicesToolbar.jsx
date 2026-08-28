import { Filter, Laptop, Plus, Search } from 'lucide-react';
import { Button } from '../ui/Button';

const chips = [
  { id: 'all', label: 'All' },
  { id: 'Healthy', label: 'Healthy', dot: 'bg-emerald-400' },
  { id: 'Warning', label: 'Attention', dot: 'bg-amber-400' },
  { id: 'Critical', label: 'Critical', dot: 'bg-red-500' },
  { id: 'Offline', label: 'Offline', dot: 'bg-zinc-400' },
];

export function DevicesToolbar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  type,
  onTypeChange,
  types,
  onCreate,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Devices</h1>
          <p className="mt-1 text-sm text-zinc-400">Managed endpoints, health, and compliance.</p>
        </div>
        <Button onClick={onCreate}>
          <Plus size={16} />
          Enroll devices
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onStatusChange(chip.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              status === chip.id
                ? 'border-violet-400/40 bg-violet-500/15 text-white'
                : 'border-white/15 bg-white/[0.03] text-zinc-400 hover:text-white'
            }`}
          >
            {chip.dot && <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />}
            {chip.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search devices by name, user, serial..."
            className="focus-ring w-full rounded-xl border border-white/15 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <div className="relative sm:w-48">
          <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <select
            value={type}
            onChange={(event) => onTypeChange(event.target.value)}
            className="focus-ring w-full appearance-none rounded-xl border border-white/15 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-zinc-200"
          >
            <option value="all" className="bg-zinc-900">
              All types
            </option>
            {types.map((item) => (
              <option key={item.value} value={item.value} className="bg-zinc-900">
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export function DeviceTypeIcon() {
  return <Laptop size={16} className="text-violet-300" />;
}
