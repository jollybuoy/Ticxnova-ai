import { Download, Filter, Plus, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '../../lib/tickets/constants';

const pills = [
  { id: 'mine', label: 'My tickets' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'p1', label: 'P1 Critical', dot: 'bg-red-500' },
  { id: 'sla', label: 'SLA risk', dot: 'bg-orange-400' },
  { id: 'today', label: 'Updated today' },
];

export function TicketsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sort,
  onSortChange,
  quickFilter,
  onQuickFilterChange,
  onCreateClick,
  onExport,
  totalCount,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Tickets</h1>
          <p className="mt-1 text-sm text-zinc-400">{totalCount} in this view</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={onExport}>
            <Download size={16} />
            Export
          </Button>
          <Button onClick={onCreateClick}>
            <Plus size={16} />
            New ticket
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {pills.map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={() => onQuickFilterChange(quickFilter === pill.id ? 'all' : pill.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              quickFilter === pill.id
                ? 'border-violet-400/40 bg-violet-500/15 text-white'
                : 'border-white/15 bg-white/[0.03] text-zinc-400 hover:text-white'
            }`}
          >
            {pill.dot && <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />}
            {pill.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[180px_1fr_140px_140px]">
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          className="focus-ring rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-zinc-200"
        >
          <option value="queue" className="bg-zinc-900">
            All open tickets
          </option>
          <option value="all" className="bg-zinc-900">
            All tickets
          </option>
          {TICKET_STATUSES.map((status) => (
            <option key={status.value} value={status.value} className="bg-zinc-900">
              {status.label}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            placeholder="Search tickets by ID, subject, requester..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="focus-ring w-full rounded-xl border border-white/15 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <select
            value={priorityFilter}
            onChange={(event) => onPriorityFilterChange(event.target.value)}
            className="focus-ring w-full appearance-none rounded-xl border border-white/15 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-zinc-200"
          >
            <option value="all" className="bg-zinc-900">
              Filters
            </option>
            {TICKET_PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value} className="bg-zinc-900">
                {priority.label}
              </option>
            ))}
          </select>
        </div>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="focus-ring rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-zinc-200"
        >
          <option value="updated" className="bg-zinc-900">
            Sort: Updated
          </option>
          <option value="priority" className="bg-zinc-900">
            Sort: Priority
          </option>
          <option value="sla" className="bg-zinc-900">
            Sort: SLA
          </option>
        </select>
      </div>
    </div>
  );
}
