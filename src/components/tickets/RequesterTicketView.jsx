import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Send } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  formatTicketDate,
  getPriorityMeta,
  getStatusMeta,
} from '../../lib/tickets/constants';
import {
  formatAge,
  getCommentBody,
  getCommentVisibility,
} from '../../lib/tickets/incidentModel';

export function RequesterTicketView({
  ticket,
  comments,
  kbCitations = [],
  mutating,
  onAddComment,
}) {
  const [body, setBody] = useState('');
  const statusMeta = getStatusMeta(ticket.status);
  const priorityMeta = getPriorityMeta(ticket.priority);
  const publicComments = useMemo(
    () => comments.filter((comment) => getCommentVisibility(comment) === 'public'),
    [comments],
  );

  const submit = async (event) => {
    event.preventDefault();
    const result = await onAddComment(body, 'public');
    if (result.success) setBody('');
  };

  return (
    <div className="space-y-4">
      <Link
        to="/portal"
        className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 hover:text-white"
      >
        <ArrowLeft size={14} />
        My requests / {ticket.ticket_number}
      </Link>

      <div className="ticket-workspace-frame space-y-5 p-4 sm:p-6">
        <div>
          <h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {ticket.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-zinc-200">
              {ticket.ticket_number}
            </span>
            <Badge variant={priorityMeta.badge}>{priorityMeta.label}</Badge>
            <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            Opened {formatAge(ticket.created_at)}
            {ticket.assignee_name ? ` · Assigned to ${ticket.assignee_name}` : ' · Waiting for IT'}
          </p>
        </div>

        {ticket.description && (
          <div className="glass-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Your request
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
              {ticket.description}
            </p>
          </div>
        )}

        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white">Updates you can see</h2>
          {publicComments.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              No public replies yet. Internal technician notes stay hidden.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {publicComments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-xs text-zinc-500">
                    {comment.author_name || 'IT team'} · {formatTicketDate(comment.created_at)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                    {getCommentBody(comment)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="glass-card space-y-3 p-4">
          <textarea
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={mutating}
            placeholder="Add more detail or reply to IT…"
            className="field-control focus-ring w-full resize-none rounded-xl border px-4 py-3 text-sm"
          />
          <div className="flex justify-end">
            <Button type="submit" loading={mutating} disabled={mutating || !body.trim()}>
              <Send size={15} />
              Send update
            </Button>
          </div>
        </form>

        {kbCitations.length > 0 && (
          <div className="glass-card p-5">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <BookOpen size={16} className="text-violet-300" />
              Suggested articles
            </p>
            <div className="mt-3 space-y-2">
              {kbCitations.map((article) => (
                <Link
                  key={article.id}
                  to="/knowledge-base"
                  className="block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 hover:text-white"
                >
                  {article.title}
                  {article.category ? (
                    <span className="mt-1 block text-xs text-zinc-500">{article.category}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
