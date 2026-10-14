import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Clock3, LifeBuoy, Plus, Ticket } from 'lucide-react';
import { CreateTicketModal } from '../../components/tickets/CreateTicketModal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { useTickets } from '../../hooks/useTickets';
import { getUserDisplayName, getUserEmail } from '../../lib/user';
import { isOwnRequest } from '../../lib/portal/requesterAccess';
import { getPriorityMeta, getStatusMeta } from '../../lib/tickets/constants';
import { formatAge } from '../../lib/tickets/incidentModel';
import { OPEN_STATUSES } from '../../lib/tickets/queueMetrics';

export default function RequesterPortal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { tickets, loading, mutating, createTicket } = useTickets();
  const [createOpen, setCreateOpen] = useState(false);
  const displayName = getUserDisplayName(user);
  const email = getUserEmail(user);

  const mine = useMemo(
    () => tickets.filter((ticket) => isOwnRequest(ticket, user)),
    [tickets, user],
  );
  const open = mine.filter((ticket) => OPEN_STATUSES.includes(ticket.status));
  const recent = mine.slice(0, 6);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">
            {tenant?.company_name || 'IT support'}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Hi {displayName.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Submit a request, follow your open tickets, and browse help articles. Your IT team still uses the full technician workspace.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          New request
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-5">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
            <Ticket size={14} />
            Open requests
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{loading ? '—' : open.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
            <Clock3 size={14} />
            All my tickets
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{loading ? '—' : mine.length}</p>
        </div>
        <Link to="/knowledge-base" className="glass-card p-5 transition hover:border-violet-400/40">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
            <BookOpen size={14} />
            Help center
          </p>
          <p className="mt-3 text-sm font-medium text-white">Search published articles</p>
        </Link>
      </div>

      <section className="ticket-workspace-frame p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">My requests</h2>
            <p className="mt-1 text-sm text-zinc-500">Only tickets you opened or were listed on as requester.</p>
          </div>
          <Link to="/tickets" className="text-sm font-medium text-violet-300 hover:text-white">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-zinc-500">Loading your requests…</p>
        ) : recent.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center">
            <LifeBuoy className="mx-auto h-8 w-8 text-violet-300" />
            <p className="mt-3 text-sm text-zinc-400">You have not submitted a request yet.</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              New request
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {recent.map((ticket) => {
              const status = getStatusMeta(ticket.status);
              const priority = getPriorityMeta(ticket.priority);
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:border-violet-400/40 hover:bg-white/[0.06]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{ticket.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {ticket.ticket_number} · {formatAge(ticket.updated_at || ticket.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={priority.badge}>{priority.label}</Badge>
                    <Badge variant={status.badge}>{status.label}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createTicket}
        loading={mutating}
        selfService
        seed={{
          requester_name: displayName,
          requester_email: email,
        }}
      />
    </>
  );
}
