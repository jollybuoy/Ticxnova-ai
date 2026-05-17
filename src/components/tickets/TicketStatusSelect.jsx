import { TICKET_STATUSES } from '../../lib/tickets/constants';

export function TicketStatusSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="focus-ring rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:border-white/15 focus:border-violet-500/40 disabled:opacity-50"
      aria-label="Ticket status"
    >
      {TICKET_STATUSES.map((status) => (
        <option key={status.value} value={status.value} className="bg-zinc-900">
          {status.label}
        </option>
      ))}
    </select>
  );
}
