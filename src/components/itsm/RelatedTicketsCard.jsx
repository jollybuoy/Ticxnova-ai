import { Link } from 'react-router-dom';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { formatTicketDate, getPriorityMeta, getStatusMeta } from '../../lib/tickets/constants';

export function RelatedTicketsCard({ tickets }) {
  const openCount = tickets.filter((ticket) => ['open', 'in_progress', 'pending'].includes(ticket.status)).length;

  return (
    <Card hover={false}>
      <CardHeader title="Related Tickets" subtitle={`${openCount} open issue${openCount === 1 ? '' : 's'} on this asset`} />
      <CardBody>
        {tickets.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-500">
            No related tickets for this device.
          </p>
        ) : (
          <div className="space-y-3">
            {tickets.slice(0, 8).map((ticket) => {
              const status = getStatusMeta(ticket.status);
              const priority = getPriorityMeta(ticket.priority);
              return (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="block rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{ticket.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {ticket.ticket_number} · {formatTicketDate(ticket.created_at)}
                      </p>
                    </div>
                    <ArrowUpRight size={16} className="text-zinc-500" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant={status.badge}>{status.label}</Badge>
                    <Badge variant={priority.badge}>{priority.label}</Badge>
                    {ticket.status !== 'resolved' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300">
                        <AlertCircle size={12} />
                        Active
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
