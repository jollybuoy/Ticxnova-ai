import { Bot } from 'lucide-react';
import { TicketProposalCard } from './TicketProposalCard';
import { ConfirmationActions } from './ConfirmationActions';

export function AIMessage({
  message,
  onCreateTicket,
  onPrepareTicket,
  onDeclineTicket,
  creatingTicket,
}) {
  return (
    <>
      <div
        className={`rounded-2xl border px-4 py-3 shadow-lg ${
          message.isError
            ? 'border-red-500/25 bg-red-500/10 text-red-100'
            : 'glass-card text-zinc-200'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
      </div>

      {message.ticketDraft &&
        !message.proposalReady &&
        !message.ticketCreated &&
        !message.ticketDeclined && (
          <div className="mt-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="text-sm font-semibold text-white">Would you like to create a ticket?</p>
            <p className="mt-1 text-xs text-zinc-400">
              I can prepare the ticket details for your review before anything is created.
            </p>
            <ConfirmationActions
              confirmLabel="Create Ticket"
              dismissLabel="No Thanks"
              onConfirm={() => onPrepareTicket?.(message)}
              onDismiss={() => onDeclineTicket?.(message)}
              loading={false}
            />
          </div>
        )}

      {(message.proposalReady || message.ticketCreated) && message.ticketDraft && (
        <TicketProposalCard
          draft={message.ticketDraft}
          created={message.ticketCreated}
          ticketId={message.ticketId}
          ticketNumber={message.ticketNumber}
          createdAt={message.ticketCreatedAt}
          loading={creatingTicket}
          onConfirm={(draft) => onCreateTicket?.(message, draft)}
        />
      )}
    </>
  );
}

export function AIAvatar() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20">
      <Bot size={18} />
    </div>
  );
}
