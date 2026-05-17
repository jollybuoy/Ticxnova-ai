import { Link } from 'react-router-dom';
import { formatTicketDate } from '../../lib/tickets/constants';

export function DeviceIncidentTimeline({ tickets }) {
  const incidents = tickets.slice(0, 6);

  return (
    <div className="relative space-y-4 before:absolute before:bottom-0 before:left-1 before:top-2 before:w-px before:bg-white/10">
      {incidents.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-500">
          No incident history yet.
        </p>
      ) : (
        incidents.map((ticket) => (
          <div key={ticket.id} className="relative pl-7">
            <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-4 ring-amber-400/10" />
            <Link to={`/tickets/${ticket.id}`} className="block rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 hover:bg-white/[0.06]">
              <p className="text-sm font-semibold text-white">{ticket.title}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {ticket.ticket_number} · {ticket.status?.replace('_', ' ')} · {formatTicketDate(ticket.created_at)}
              </p>
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
