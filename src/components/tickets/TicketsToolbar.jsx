import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '../../lib/tickets/constants';

export function TicketsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  counts,
  onCreateClick,
  totalCount,
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-label mb-1">Service desk</p>
          <h1 className="text-display text-2xl sm:text-3xl">Tickets</h1>
          <p className="text-body mt-1">
            {totalCount} {totalCount === 1 ? 'ticket' : 'tickets'} in your current view
          </p>
        </div>

        <Button variant="primary" onClick={onCreateClick} className="shrink-0 self-start">
          <Plus size={18} />
          New ticket
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['All', counts.all],
          ['Open', counts.open],
          ['In Progress', counts.in_progress],
          ['Pending', counts.pending],
          ['Resolved', counts.resolved],
        ].map(([label, value]) => (
          <div key={label} className="glass rounded-2xl px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <div className="relative flex-1 sm:min-w-[220px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="search"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="focus-ring w-full rounded-xl border border-white/[0.08] bg-black/30 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600"
          />
        </div>

        <div className="relative">
          <Filter
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="focus-ring w-full appearance-none rounded-xl border border-white/[0.08] bg-black/30 py-2.5 pl-10 pr-8 text-sm text-zinc-200"
          >
            <option value="all" className="bg-zinc-900">
              All statuses
            </option>
            {TICKET_STATUSES.map((s) => (
              <option key={s.value} value={s.value} className="bg-zinc-900">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="focus-ring w-full appearance-none rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm text-zinc-200"
          >
            <option value="all" className="bg-zinc-900">
              All priorities
            </option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value} className="bg-zinc-900">
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
