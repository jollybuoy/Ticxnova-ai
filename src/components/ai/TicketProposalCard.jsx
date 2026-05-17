import { Link } from 'react-router-dom';
import { Building2, FileText, Gauge, Layers, TicketPlus } from 'lucide-react';
import { ConfirmationActions } from './ConfirmationActions';

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        <Icon size={13} />
        {label}
      </div>
      <p className="text-sm font-medium capitalize text-white">{value || 'Not specified'}</p>
    </div>
  );
}

export function TicketProposalCard({
  draft,
  created,
  ticketId,
  ticketNumber,
  createdAt,
  onConfirm,
  loading,
}) {
  if (!draft && !created) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/15 to-violet-500/10">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30">
            <TicketPlus size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
              {created ? `Ticket ${ticketNumber} created` : 'Proposed support ticket'}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {created
                ? 'The request is now available in your ticket queue.'
                : 'Would you like me to create this support ticket?'}
            </p>
          </div>
        </div>
      </div>

      {created ? (
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail icon={TicketPlus} label="Ticket number" value={ticketNumber} />
            <Detail icon={Gauge} label="Status" value="Open" />
            <Detail icon={Building2} label="Department" value={draft?.department} />
            <Detail icon={FileText} label="Created" value={createdAt} />
          </div>
          <Link
            to={ticketId ? `/tickets/${ticketId}` : '/tickets'}
            className="mt-4 inline-flex rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-400"
          >
            Open ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          <div>
            <p className="text-label">Title</p>
            <p className="mt-1 text-sm font-semibold text-white">{draft.title}</p>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">{draft.summary}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Detail icon={Layers} label="Category" value={draft.category} />
            <Detail icon={Gauge} label="Priority" value={draft.priority} />
            <Detail icon={Building2} label="Department" value={draft.department} />
          </div>
          <ConfirmationActions onConfirm={onConfirm} loading={loading} />
          <p className="text-[11px] text-zinc-500">
            You can also reply “yes”, “confirm”, “proceed”, or “create it”.
          </p>
        </div>
      )}
    </div>
  );
}
