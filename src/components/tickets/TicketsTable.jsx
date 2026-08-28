import { ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { UserAvatar } from '../ui/UserAvatar';
import { TICKET_STATUSES, getPriorityMeta, getStatusMeta } from '../../lib/tickets/constants';
import { formatAge } from '../../lib/tickets/incidentModel';
import { formatSlaClock } from '../../lib/tickets/queueMetrics';

const priorityDot = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-emerald-400',
};

function SlaPill({ ticket }) {
  const sla = formatSlaClock(ticket);
  const cls =
    sla.tone === 'red'
      ? 'border-red-400/40 bg-red-500 text-white'
      : sla.tone === 'orange'
        ? 'border-orange-400/40 text-orange-300'
        : 'border-emerald-400/40 text-emerald-300';
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${cls}`}>{sla.text}</span>;
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <Ticket className="mb-4 h-8 w-8 text-violet-400" />
      <h3 className="text-lg font-semibold text-white">No tickets in this view</h3>
      <button type="button" onClick={onCreate} className="mt-4 text-sm font-medium text-violet-400">
        + Create ticket
      </button>
    </div>
  );
}

export function TicketsTable({
  tickets,
  loading,
  mutating,
  selectedIds,
  onToggle,
  onToggleAll,
  onOpen,
  onCreate,
  onBulkStatus,
  onBulkAssign,
  onAddNote,
  page,
  pageSize,
  totalCount,
  onPageChange,
}) {
  const allSelected = tickets.length > 0 && tickets.every((ticket) => selectedIds.includes(ticket.id));
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  if (loading) {
    return (
      <Card hover={false} className="flex min-h-[420px] items-center justify-center">
        <Spinner className="h-8 w-8 text-violet-400" />
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card hover={false}>
        <EmptyState onCreate={onCreate} />
      </Card>
    );
  }

  return (
    <Card hover={false} className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-white/15 text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={onToggleAll} />
              </th>
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">Subject</th>
              <th className="px-3 py-3">Requester</th>
              <th className="px-3 py-3">Priority</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Assignee</th>
              <th className="px-3 py-3">Updated</th>
              <th className="px-3 py-3">SLA</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const priority = getPriorityMeta(ticket.priority);
              const status = getStatusMeta(ticket.status);
              return (
                <tr
                  key={ticket.id}
                  className="cursor-pointer border-b border-white/10 last:border-0 hover:bg-white/[0.03]"
                  onClick={() => onOpen(ticket)}
                >
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(ticket.id)}
                      onChange={() => onToggle(ticket.id)}
                    />
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-blue-400">{ticket.ticket_number}</td>
                  <td className="max-w-[260px] px-3 py-3">
                    <p className="truncate text-sm font-medium text-white">{ticket.title}</p>
                    <p className="truncate text-xs text-zinc-500">{ticket.department || ticket.category || '—'}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={ticket.requester_name || 'Requester'} />
                      <div>
                        <p className="text-sm text-zinc-200">{ticket.requester_name || '—'}</p>
                        <p className="text-[11px] text-zinc-500">{ticket.department || ticket.requester_email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-2 text-sm text-zinc-200">
                      <span className={`h-2 w-2 rounded-full ${priorityDot[ticket.priority] || 'bg-zinc-400'}`} />
                      {priority.label.replace('P1 - ', 'P1 ').replace('P2 - ', 'P2 ').replace('P3 - ', 'P3 ').replace('P4 - ', 'P4 ')}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={status.badge}>{status.label}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    {ticket.assignee_name ? (
                      <span className="inline-flex items-center gap-2 text-sm text-zinc-200">
                        <UserAvatar name={ticket.assignee_name} />
                        {ticket.assignee_name}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-zinc-400">{formatAge(ticket.updated_at || ticket.created_at)}</td>
                  <td className="px-3 py-3">
                    <SlaPill ticket={ticket} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-white/15 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <span>{selectedIds.length} selected.</span>
          <select
            disabled={!selectedIds.length || mutating}
            onChange={(event) => {
              if (event.target.value) onBulkStatus(event.target.value);
              event.target.value = '';
            }}
            className="rounded-lg border border-white/15 bg-transparent px-2 py-1 text-xs disabled:opacity-40"
          >
            <option value="">Change status</option>
            {TICKET_STATUSES.map((status) => (
              <option key={status.value} value={status.value} className="bg-zinc-900">
                {status.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedIds.length || mutating}
            onClick={() => {
              const name = window.prompt('Assign to');
              if (name?.trim()) onBulkAssign(name.trim());
            }}
            className="rounded-lg border border-white/15 px-2 py-1 text-xs disabled:opacity-40"
          >
            Assign
          </button>
          <button
            type="button"
            disabled={!selectedIds.length}
            onClick={onAddNote}
            className="rounded-lg border border-white/15 px-2 py-1 text-xs disabled:opacity-40"
          >
            Add note
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-white/15 p-1.5 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-violet-600 px-2 text-xs font-semibold text-white">
            {page}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-white/15 p-1.5 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
