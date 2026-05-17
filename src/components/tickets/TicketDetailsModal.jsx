import { useState } from 'react';
import { Bot, Clock, FileText, Sparkles, UserRound } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { TicketStatusSelect } from './TicketStatusSelect';
import {
  formatTicketDate,
  getPriorityMeta,
  getStatusMeta,
} from '../../lib/tickets/constants';

function AiSummaryCard({ summary, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <Spinner className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Analyzing ticket</p>
            <p className="text-xs text-zinc-400">AI is reading the issue and preparing recommendations…</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-2 w-full animate-pulse rounded-full bg-white/10" />
          <div className="h-2 w-4/5 animate-pulse rounded-full bg-white/10" />
          <div className="h-2 w-2/3 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 to-blue-500/10 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={16} className="text-violet-300" />
        <h3 className="text-sm font-semibold text-white">AI Ticket Summary</h3>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">{summary.summary}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-label">Suggested category</p>
          <p className="mt-1 text-sm font-medium text-white">{summary.category}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-label">Suggested priority</p>
          <p className="mt-1 text-sm font-medium capitalize text-white">{summary.priority}</p>
        </div>
      </div>
      {summary.reasoning && (
        <p className="mt-4 text-xs leading-relaxed text-zinc-400">{summary.reasoning}</p>
      )}
    </div>
  );
}

export function TicketDetailsModal({
  ticket,
  open,
  onClose,
  mutating,
  onStatusChange,
  onSummarize,
}) {
  const [summary, setSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (!ticket) return null;

  const statusMeta = getStatusMeta(ticket.status);
  const priorityMeta = getPriorityMeta(ticket.priority);

  const handleSummarize = async () => {
    setAiLoading(true);
    const result = await onSummarize(ticket);
    if (result.success) {
      setSummary(result.data);
    }
    setAiLoading(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ticket.title}
      description={`${ticket.ticket_number} · Created ${formatTicketDate(ticket.created_at)}`}
      size="xl"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <FileText size={16} className="text-violet-300" />
              Issue description
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
              {ticket.description || 'No description provided.'}
            </p>
          </div>

          <AiSummaryCard summary={summary} loading={aiLoading} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <p className="text-label mb-3">Status</p>
            <TicketStatusSelect
              value={ticket.status}
              disabled={mutating}
              onChange={(status) => onStatusChange(ticket.id, status)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
              <Badge variant={priorityMeta.badge}>{priorityMeta.label}</Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <UserRound size={16} className="mt-0.5 text-zinc-500" />
                <div>
                  <p className="text-label">Requester</p>
                  <p className="mt-1 text-white">{ticket.requester_name || 'Unassigned'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Bot size={16} className="mt-0.5 text-zinc-500" />
                <div>
                  <p className="text-label">Category</p>
                  <p className="mt-1 text-white">{ticket.category || 'Uncategorized'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={16} className="mt-0.5 text-zinc-500" />
                <div>
                  <p className="text-label">Updated</p>
                  <p className="mt-1 text-white">{formatTicketDate(ticket.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            className="w-full"
            loading={aiLoading}
            disabled={aiLoading}
            onClick={handleSummarize}
          >
            <Sparkles size={16} />
            Summarize with AI
          </Button>
        </aside>
      </div>
    </Modal>
  );
}
