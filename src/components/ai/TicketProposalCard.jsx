import { Link } from 'react-router-dom';
import { Building2, FileText, Gauge, Layers, TicketPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConfirmationActions } from './ConfirmationActions';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_TYPES,
} from '../../lib/tickets/constants';

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
  const [form, setForm] = useState(draft ?? {});

  useEffect(() => {
    setForm(draft ?? {});
  }, [draft]);

  if (!draft && !created) return null;

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

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
            <Detail icon={Layers} label="Type" value={draft?.ticket_type?.replace('_', ' ')} />
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
          <label className="block">
            <p className="text-label">Title</p>
            <input
              value={form.title ?? ''}
              onChange={update('title')}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/40"
            />
          </label>
          <label className="block">
            <p className="text-label">Summary</p>
            <textarea
              value={form.summary ?? ''}
              onChange={update('summary')}
              rows={3}
              className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm leading-relaxed text-zinc-200 outline-none focus:border-blue-500/40"
            />
          </label>
          <label className="block">
            <p className="text-label">Description</p>
            <textarea
              value={form.description ?? ''}
              onChange={update('description')}
              rows={4}
              className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm leading-relaxed text-zinc-200 outline-none focus:border-blue-500/40"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <p className="text-label mb-1">Type</p>
              <select
                value={form.ticket_type ?? 'incident'}
                onChange={update('ticket_type')}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm capitalize text-white outline-none focus:border-blue-500/40"
              >
                {TICKET_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="bg-zinc-900">
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <p className="text-label mb-1">Priority</p>
              <select
                value={form.priority ?? 'medium'}
                onChange={update('priority')}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm capitalize text-white outline-none focus:border-blue-500/40"
              >
                {TICKET_PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value} className="bg-zinc-900">
                    {priority.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <p className="text-label mb-1">Category</p>
              <select
                value={form.category ?? 'Other'}
                onChange={update('category')}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/40"
              >
                {TICKET_CATEGORIES.map((category) => (
                  <option key={category} value={category} className="bg-zinc-900">
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <p className="text-label mb-1">Department</p>
              <input
                value={form.department ?? ''}
                onChange={update('department')}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/40"
              />
            </label>
          </div>
          <ConfirmationActions onConfirm={() => onConfirm(form)} loading={loading} />
          <p className="text-[11px] text-zinc-500">
            You can also reply “yes”, “confirm”, “proceed”, or “create it”.
          </p>
        </div>
      )}
    </div>
  );
}
