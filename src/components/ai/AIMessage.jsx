import { Bot } from 'lucide-react';
import { TicketProposalCard } from './TicketProposalCard';

export function AIMessage({ message, onCreateTicket, creatingTicket }) {
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

      {message.ticketDraft && (
        <TicketProposalCard
          draft={message.ticketDraft}
          created={message.ticketCreated}
          ticketId={message.ticketId}
          ticketNumber={message.ticketNumber}
          createdAt={message.ticketCreatedAt}
          loading={creatingTicket}
          onConfirm={() => onCreateTicket?.(message)}
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
