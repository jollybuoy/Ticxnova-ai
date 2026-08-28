import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  FilePenLine,
  MessageSquare,
  Monitor,
  Paperclip,
  Send,
  Shield,
  Sparkles,
  Siren,
  UserRound,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';
import { LinkedDevicesPanel } from '../itsm/LinkedDevicesPanel';
import {
  formatTicketDate,
  getPriorityMeta,
  getStatusMeta,
  getTicketTypeMeta,
} from '../../lib/tickets/constants';
import {
  INCIDENT_STEPS,
  buildRequesterDraft,
  buildSuggestedActions,
  buildTimeline,
  canEscalate,
  formatAge,
  formatRemaining,
  getCopilotConfidence,
  getIncidentHealth,
  getStepIndex,
  getTicketSla,
  isMajorIncidentCandidate,
  nextPriority,
} from '../../lib/tickets/incidentModel';

function SlaGauge({ ticket }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const sla = getTicketSla(ticket, now);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(sla.percent, 100) / 100) * circumference;
  const stroke = sla.breached ? '#f87171' : sla.atRisk ? '#fb923c' : '#60a5fa';

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="relative h-[88px] w-[88px] shrink-0">
        <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="drop-shadow-[0_0_8px_rgba(96,165,250,0.45)]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold tracking-wide text-zinc-400">SLA</span>
          <span className="text-sm font-bold tabular-nums text-white">
            {ticket.status === 'resolved' ? sla.label : formatRemaining(sla.remainingMs)}
          </span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Resolution SLA</p>
        <p className="mt-1 text-sm font-medium text-white">{sla.label}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {ticket.priority === 'urgent' ? '4h' : ticket.priority === 'high' ? '8h' : ticket.priority === 'low' ? '48h' : '24h'} window from open
        </p>
      </div>
    </div>
  );
}

function Stepper({ status, disabled, onChange }) {
  const current = getStepIndex(status);
  return (
    <ol className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1">
      {INCIDENT_STEPS.map((step, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              disabled={disabled || status === step.id}
              onClick={() => onChange(step.id)}
              className={`flex min-w-0 items-center gap-2 rounded-full px-2 py-1.5 text-left transition-colors ${
                active
                  ? 'bg-blue-500/15 text-white'
                  : complete
                    ? 'text-zinc-200 hover:bg-white/5'
                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  active
                    ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.7)]'
                    : complete
                      ? 'bg-emerald-500/80 text-white'
                      : 'border border-white/15 bg-white/5 text-zinc-500'
                }`}
              >
                {complete ? <Check size={12} /> : index + 1}
              </span>
              <span className="truncate text-xs font-medium sm:text-sm">{step.label}</span>
            </button>
            {index < INCIDENT_STEPS.length - 1 && (
              <span className={`hidden h-px flex-1 sm:block ${index < current ? 'bg-blue-400/70' : 'bg-white/10'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function TimelineItem({ item }) {
  const styles = {
    reply: 'bg-blue-400 ring-blue-400/20',
    note: 'bg-amber-400 ring-amber-400/20',
    status: 'bg-violet-400 ring-violet-400/20',
    system: 'bg-cyan-400 ring-cyan-400/20',
    update: 'bg-zinc-400 ring-white/10',
  };
  return (
    <div className="relative pl-8">
      <span className={`absolute left-0 top-2 h-2.5 w-2.5 rounded-full ring-4 ${styles[item.kind] || styles.update}`} />
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-white">{item.title}</p>
          <span className="text-xs text-zinc-500">{formatAge(item.at)}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {item.actor}
          {item.email ? ` · ${item.email}` : ''}
          {' · '}
          {formatTicketDate(item.at)}
        </p>
        {item.body && (
          <p className="mt-3 whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 text-sm leading-relaxed text-zinc-300">
            {item.body}
          </p>
        )}
      </div>
    </div>
  );
}

export function IncidentWorkspace({
  ticket,
  comments,
  activity,
  linkedDevices,
  relatedTickets,
  mutating,
  aiLoading,
  onUpdateFields,
  onAddComment,
  onDiagnose,
  onUpdateLinkedDevices,
  onRemoveLinkedDevice,
}) {
  const [composerTab, setComposerTab] = useState('public');
  const [composerBody, setComposerBody] = useState('');
  const [doneActions, setDoneActions] = useState({});
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: ticket.title,
    description: ticket.description || '',
    assignee_name: ticket.assignee_name || '',
    department: ticket.department || '',
  });

  useEffect(() => {
    setEditForm({
      title: ticket.title,
      description: ticket.description || '',
      assignee_name: ticket.assignee_name || '',
      department: ticket.department || '',
    });
  }, [ticket]);

  const sla = getTicketSla(ticket);
  const statusMeta = getStatusMeta(ticket.status);
  const priorityMeta = getPriorityMeta(ticket.priority);
  const typeMeta = getTicketTypeMeta(ticket.ticket_type);
  const timeline = useMemo(() => buildTimeline(activity, comments), [activity, comments]);
  const confidence = getCopilotConfidence(ticket);
  const actions = buildSuggestedActions(ticket, linkedDevices);
  const health = getIncidentHealth(ticket, linkedDevices, sla);
  const major = isMajorIncidentCandidate(ticket, linkedDevices, sla);
  const primaryDevice = linkedDevices[0];

  const submitComposer = async (event) => {
    event.preventDefault();
    const result = await onAddComment(composerBody, composerTab === 'public' ? 'public' : 'internal');
    if (result.success) setComposerBody('');
  };

  const handleAction = async (action) => {
    if (action === 'start') await onUpdateFields({ status: 'in_progress' });
    if (action === 'edit') setEditOpen(true);
    if (action === 'diagnose') await onDiagnose();
    if (action === 'draft') {
      setComposerTab('public');
      setComposerBody(buildRequesterDraft(ticket));
    }
  };

  const saveEdits = async () => {
    const result = await onUpdateFields({
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      assignee_name: editForm.assignee_name.trim() || null,
      department: editForm.department.trim() || null,
    });
    if (result.success) setEditOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <Link
            to="/tickets"
            className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 hover:text-white"
          >
            <ArrowLeft size={14} />
            Tickets / {ticket.ticket_number}
          </Link>
          <h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {ticket.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-zinc-200">
              {ticket.ticket_number}
            </span>
            <Badge variant={priorityMeta.badge}>{priorityMeta.label}</Badge>
            <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
            <Badge variant="purple">{typeMeta.label}</Badge>
            {ticket.category && <Badge variant="slate">{ticket.category}</Badge>}
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            Opened {formatAge(ticket.created_at)}
            {ticket.requester_name ? ` · Requester ${ticket.requester_name}` : ''}
            {linkedDevices.length > 0 ? ` · ${linkedDevices.length} affected asset${linkedDevices.length === 1 ? '' : 's'}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={mutating} onClick={() => setEditOpen(true)}>
            <FilePenLine size={16} />
            Update
          </Button>
          <Button
            variant="secondary"
            disabled={mutating || !canEscalate(ticket.priority)}
            onClick={() => onUpdateFields({ priority: nextPriority(ticket.priority) })}
          >
            <Siren size={16} />
            Escalate
          </Button>
          <Button
            disabled={mutating || ticket.status === 'resolved'}
            onClick={() => onUpdateFields({ status: 'resolved' })}
          >
            <CheckCircle2 size={16} />
            Resolve
          </Button>
        </div>
      </div>

      <div className="glass-card flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
        <Stepper
          status={ticket.status}
          disabled={mutating}
          onChange={(status) => onUpdateFields({ status })}
        />
        <SlaGauge ticket={ticket} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ticket.department && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            {ticket.department}
          </span>
        )}
        {primaryDevice && (
          <Link
            to={`/devices/${primaryDevice.id}`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 hover:text-white"
          >
            {primaryDevice.name}
          </Link>
        )}
        {primaryDevice?.location && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            {primaryDevice.location}
          </span>
        )}
        {ticket.requester_name && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            {ticket.requester_name}
          </span>
        )}
        {relatedTickets.length > 0 && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            {relatedTickets.length} similar report{relatedTickets.length === 1 ? '' : 's'}
          </span>
        )}
        {major && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
            <AlertTriangle size={12} />
            Major incident candidate
          </span>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          {ticket.description && (
            <div className="glass-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Incident summary</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{ticket.description}</p>
            </div>
          )}

          <div className="glass-card p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Live incident timeline</h2>
                <p className="mt-1 text-xs text-zinc-500">{timeline.length} events</p>
              </div>
            </div>
            {timeline.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-500">
                No activity yet. Status changes, replies, and notes will appear here.
              </p>
            ) : (
              <div className="relative space-y-4 before:absolute before:bottom-3 before:left-1 before:top-3 before:w-px before:bg-white/10">
                {timeline.map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          <form onSubmit={submitComposer} className="glass-card overflow-hidden">
            <div className="flex border-b border-white/10">
              {[
                { id: 'public', label: 'Reply to requester', icon: MessageSquare },
                { id: 'internal', label: 'Internal note', icon: Shield },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setComposerTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    composerTab === tab.id
                      ? 'bg-white/[0.06] text-white'
                      : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  <tab.icon size={15} />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="space-y-3 p-4">
              <textarea
                rows={5}
                value={composerBody}
                onChange={(event) => setComposerBody(event.target.value)}
                disabled={mutating}
                placeholder={
                  composerTab === 'public'
                    ? 'Write an update the requester can see...'
                    : 'Document troubleshooting, next steps, or private context...'
                }
                className="field-control focus-ring w-full resize-none rounded-xl border px-4 py-3 text-sm"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-xs text-zinc-500">
                  <Paperclip size={14} />
                  {composerTab === 'public' ? 'Visible to the requester' : 'Internal only'}
                </p>
                <Button type="submit" loading={mutating} disabled={mutating || !composerBody.trim()}>
                  <Send size={15} />
                  {composerTab === 'public' ? 'Send reply' : 'Add note'}
                </Button>
              </div>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="glass-card overflow-hidden border-violet-400/20 shadow-[0_0_40px_rgba(139,92,246,0.12)]">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                  <Sparkles size={16} className="text-violet-300" />
                  Ticxnova Copilot
                </p>
                <p className="mt-1 text-xs text-zinc-500">Incident diagnostics and next actions</p>
              </div>
              <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-200">
                Confidence {confidence}%
              </span>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Summary</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  {ticket.ai_summary || 'Run diagnostics to generate an AI summary for this incident.'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Likely cause</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  {ticket.ai_reasoning ||
                    (ticket.category
                      ? `Current classification is ${ticket.category}${ticket.ai_suggested_category ? `, suggested ${ticket.ai_suggested_category}` : ''}.`
                      : 'No cause hypothesis yet. Diagnostics will use the ticket title and description.')}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Suggested next actions</p>
                <ul className="mt-2 space-y-2">
                  {actions.map((item) => {
                    const checked = item.done || doneActions[item.id];
                    return (
                      <li key={item.id} className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => setDoneActions((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            checked ? 'border-violet-400 bg-violet-500 text-white' : 'border-white/20'
                          }`}
                          aria-pressed={checked}
                        >
                          {checked && <Check size={10} />}
                        </button>
                        {item.action ? (
                          <button
                            type="button"
                            className="text-left text-sm text-zinc-300 hover:text-white"
                            disabled={mutating || aiLoading}
                            onClick={() => handleAction(item.action)}
                          >
                            {item.label}
                          </button>
                        ) : (
                          <span className="text-sm text-zinc-300">{item.label}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" className="w-full text-xs" loading={aiLoading} disabled={aiLoading} onClick={onDiagnose}>
                  <Bot size={14} />
                  Run diagnostics
                </Button>
                <Button variant="secondary" className="w-full text-xs" onClick={() => handleAction('draft')}>
                  Draft update
                </Button>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-white">Incident health</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Scope', value: health.scope, icon: Monitor },
                { label: 'Sentiment', value: health.sentiment, icon: UserRound, tone: health.sentimentTone },
                { label: 'SLA', value: health.slaLabel, icon: Clock3, tone: health.slaTone },
                { label: 'Change risk', value: health.changeRisk, icon: Shield, tone: health.changeTone },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
                    <metric.icon size={12} />
                    {metric.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-white">Ownership & context</p>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['Assignee', ticket.assignee_name || 'Unassigned'],
                ['Group', ticket.department || '—'],
                ['Requester', ticket.requester_name || '—'],
                ['Email', ticket.requester_email || '—'],
                ['Device', primaryDevice?.name || 'None linked'],
                ['Location', primaryDevice?.location || '—'],
                ['Type', typeMeta.label],
                ['Opened', formatTicketDate(ticket.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 border-b border-white/[0.05] pb-2 last:border-0 last:pb-0">
                  <dt className="text-zinc-500">{label}</dt>
                  <dd className="text-right text-zinc-200">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <LinkedDevicesPanel
            devices={linkedDevices}
            selectedIds={linkedDevices.map((device) => device.id)}
            onSelectionChange={onUpdateLinkedDevices}
            onRemove={onRemoveLinkedDevice}
            mutating={mutating}
          />

          {relatedTickets.length > 0 && (
            <div className="glass-card p-5">
              <p className="text-sm font-semibold text-white">Similar reports</p>
              <div className="mt-3 space-y-2">
                {relatedTickets.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    to={`/tickets/${item.id}`}
                    className="block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06]"
                  >
                    <p className="flex items-center justify-between gap-2 text-sm text-white">
                      <span className="truncate">{item.title}</span>
                      <ArrowUpRight size={14} className="text-zinc-500" />
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.ticket_number} · {getStatusMeta(item.status).label}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Update incident"
        description="Edit the visible ticket details, owner, and department."
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={editForm.title}
            onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <Textarea
            label="Description"
            value={editForm.description}
            onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Assignee"
              value={editForm.assignee_name}
              onChange={(event) => setEditForm((prev) => ({ ...prev, assignee_name: event.target.value }))}
            />
            <Input
              label="Department / group"
              value={editForm.department}
              onChange={(event) => setEditForm((prev) => ({ ...prev, department: event.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button loading={mutating} disabled={mutating || !editForm.title.trim()} onClick={saveEdits}>
              Save updates
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
