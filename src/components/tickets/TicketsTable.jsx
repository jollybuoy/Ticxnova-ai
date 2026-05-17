import { motion } from 'framer-motion';
import { Trash2, Ticket } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { TicketStatusSelect } from './TicketStatusSelect';
import {
  formatTicketDate,
  getPriorityLabel,
  getStatusMeta,
} from '../../lib/tickets/constants';

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-500/25">
        <Ticket className="h-7 w-7 text-violet-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">No tickets yet</h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-400">
        Create your first support ticket to start tracking IT requests.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 text-sm font-medium text-violet-400 hover:text-violet-300"
      >
        + Create ticket
      </button>
    </div>
  );
}

function TicketRow({ ticket, mutating, onStatusChange, onDelete }) {
  const statusMeta = getStatusMeta(ticket.status);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
    >
      <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-violet-400">
        {ticket.ticket_number}
      </td>
      <td className="max-w-[200px] px-4 py-4">
        <p className="truncate text-sm font-medium text-white">{ticket.title}</p>
        {ticket.requester_name && (
          <p className="mt-0.5 truncate text-xs text-zinc-500">{ticket.requester_name}</p>
        )}
      </td>
      <td className="hidden px-4 py-4 text-sm text-zinc-400 md:table-cell">
        {ticket.category ?? '—'}
      </td>
      <td className="hidden px-4 py-4 text-sm text-zinc-400 sm:table-cell">
        {getPriorityLabel(ticket.priority)}
      </td>
      <td className="px-4 py-4">
        <TicketStatusSelect
          value={ticket.status}
          onChange={(status) => onStatusChange(ticket.id, status)}
          disabled={mutating}
        />
      </td>
      <td className="hidden px-4 py-4 lg:table-cell">
        <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
      </td>
      <td className="hidden whitespace-nowrap px-4 py-4 text-xs text-zinc-500 xl:table-cell">
        {formatTicketDate(ticket.created_at)}
      </td>
      <td className="px-4 py-4 text-right">
        <button
          type="button"
          onClick={() => onDelete(ticket)}
          disabled={mutating}
          className="focus-ring rounded-lg p-2 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          aria-label={`Delete ${ticket.ticket_number}`}
        >
          <Trash2 size={16} />
        </button>
      </td>
    </motion.tr>
  );
}

function TicketCard({ ticket, mutating, onStatusChange, onDelete }) {
  const statusMeta = getStatusMeta(ticket.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-white/[0.06] p-4 last:border-0"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium text-violet-400">{ticket.ticket_number}</span>
          <h3 className="mt-1 text-sm font-semibold text-white">{ticket.title}</h3>
          {ticket.requester_name && (
            <p className="mt-0.5 text-xs text-zinc-500">{ticket.requester_name}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(ticket)}
          disabled={mutating}
          className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          aria-label="Delete ticket"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
        <span className="text-xs text-zinc-500">{getPriorityLabel(ticket.priority)}</span>
        {ticket.category && (
          <span className="text-xs text-zinc-500">· {ticket.category}</span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <TicketStatusSelect
          value={ticket.status}
          onChange={(status) => onStatusChange(ticket.id, status)}
          disabled={mutating}
        />
        <span className="text-[10px] text-zinc-600">{formatTicketDate(ticket.created_at)}</span>
      </div>
    </motion.div>
  );
}

export function TicketsTable({
  tickets,
  loading,
  mutating,
  onStatusChange,
  onDelete,
  onCreate,
}) {
  if (loading) {
    return (
      <Card hover={false} className="flex min-h-[320px] items-center justify-center py-20">
        <Spinner className="h-8 w-8 text-violet-400" label="Loading tickets" />
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
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-6 py-3.5">ID</th>
                <th className="px-4 py-3.5">Title</th>
                <th className="hidden px-4 py-3.5 md:table-cell">Category</th>
                <th className="hidden px-4 py-3.5 sm:table-cell">Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="hidden px-4 py-3.5 lg:table-cell">Badge</th>
                <th className="hidden px-4 py-3.5 xl:table-cell">Created</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  mutating={mutating}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            mutating={mutating}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
      </div>
    </Card>
  );
}
