import { Link, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { UserAvatar } from '../ui/UserAvatar';
import { getPriorityMeta, getStatusMeta } from '../../lib/tickets/constants';
import { formatSlaClock } from '../../lib/tickets/queueMetrics';

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

export function RecentTickets({ tickets = [] }) {
  const navigate = useNavigate();
  return (
    <Card hover={false} className="h-full overflow-hidden">
      <CardHeader title="Priority queue" subtitle="Highest-risk open work" />
      <CardBody className="p-0">
        {tickets.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-zinc-500">No open tickets in this window.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-y border-white/12 text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">SLA</th>
                  <th className="px-4 py-3">Status</th>
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
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-blue-400">{ticket.ticket_number}</td>
                      <td className="max-w-[220px] px-4 py-3">
                        <p className="truncate text-sm text-white">{ticket.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-sm text-zinc-300">
                          <UserAvatar name={ticket.requester_name || 'Requester'} />
                          {ticket.requester_name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={priority.badge}>{priority.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-sm text-zinc-300">
                          <UserAvatar name={ticket.assignee_name || 'Unassigned'} />
                          {ticket.assignee_name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SlaPill ticket={ticket} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={status.badge}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-white/12 px-5 py-3">
          <Link to="/tickets" className="text-sm font-medium text-blue-400 hover:text-blue-300">
            View all tickets →
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
