import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Clock,
  FileText,
  MessageSquare,
  RefreshCw,
  Send,
  UserRound,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Textarea } from '../components/ui/Textarea';
import { LinkedDevicesPanel } from '../components/itsm/LinkedDevicesPanel';
import { TicketDeviceBadge } from '../components/itsm/TicketDeviceBadge';
import { useTicketDetails } from '../hooks/useTicketDetails';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  formatTicketDate,
  getPriorityMeta,
  getStatusMeta,
} from '../lib/tickets/constants';

function FieldRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 text-zinc-500" />
      <div>
        <p className="text-label">{label}</p>
        <p className="mt-1 text-sm text-white">{value || '—'}</p>
      </div>
    </div>
  );
}

function ActivityItem({ item }) {
  return (
    <div className="relative pl-7">
      <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-violet-400 ring-4 ring-violet-500/15" />
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-white">{item.message}</p>
          <span className="text-xs text-zinc-500">{formatTicketDate(item.created_at)}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {item.actor_name || 'System'} {item.actor_email ? `· ${item.actor_email}` : ''}
        </p>
        {item.field && (
          <p className="mt-2 text-xs text-zinc-400">
            <span className="capitalize">{item.field.replace('_', ' ')}</span>:{' '}
            <span className="text-zinc-500">{item.previous_value || 'None'}</span>
            {' → '}
            <span className="text-zinc-200">{item.new_value || 'None'}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function WorkNotes({ comments, onSubmit, loading }) {
  const [body, setBody] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await onSubmit(body);
    if (result.success) setBody('');
  };

  return (
    <Card hover={false}>
      <CardHeader
        title="Work Notes"
        subtitle={`${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}
      />
      <CardBody className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            label="Add internal note"
            placeholder="Document troubleshooting steps, customer contact, or next actions..."
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={loading}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={loading || !body.trim()}>
              <Send size={16} />
              Add note
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-500">
              No work notes yet.
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {comment.author_name || 'User'}
                    </p>
                    <p className="text-xs text-zinc-500">{comment.author_email}</p>
                  </div>
                  <span className="text-xs text-zinc-500">{formatTicketDate(comment.created_at)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {comment.body}
                </p>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default function TicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const {
    ticket,
    comments,
    activity,
    linkedDevices,
    loading,
    mutating,
    updateFields,
    addComment,
    updateLinkedDevices,
    removeLinkedDevice,
  } = useTicketDetails(ticketId);

  const [assignment, setAssignment] = useState({ assignee_name: '', department: '' });

  if (loading) {
    return (
      <>
        <Card hover={false} className="flex min-h-[420px] items-center justify-center">
          <Spinner className="h-8 w-8 text-violet-400" />
        </Card>
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <Card hover={false} className="p-8 text-center">
          <h1 className="text-xl font-semibold text-white">Ticket not found</h1>
          <p className="mt-2 text-sm text-zinc-400">
            This ticket may have been deleted or you may not have access.
          </p>
          <Button className="mt-6" onClick={() => navigate('/tickets')}>
            Back to tickets
          </Button>
        </Card>
      </>
    );
  }

  const statusMeta = getStatusMeta(ticket.status);
  const priorityMeta = getPriorityMeta(ticket.priority);

  const handleAssignmentSave = () => {
    updateFields({
      assignee_name: assignment.assignee_name || ticket.assignee_name || null,
      department: assignment.department || ticket.department || null,
    });
    setAssignment({ assignee_name: '', department: '' });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              to="/tickets"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to tickets
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
              <Badge variant={priorityMeta.badge}>{priorityMeta.label}</Badge>
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-zinc-400">
                {ticket.ticket_number}
              </span>
            </div>
            <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {ticket.title}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Created {formatTicketDate(ticket.created_at)} · Updated{' '}
              {formatTicketDate(ticket.updated_at)}
            </p>
          </div>

          <Button variant="secondary" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card hover={false}>
              <CardHeader title="Ticket Details" subtitle="Full issue context and request metadata" />
              <CardBody className="space-y-5">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <FileText size={16} className="text-violet-300" />
                    Description
                  </div>
                  <p className="whitespace-pre-wrap rounded-2xl border border-white/[0.06] bg-black/20 p-5 text-sm leading-relaxed text-zinc-300">
                    {ticket.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FieldRow icon={UserRound} label="Requester" value={ticket.requester_name} />
                  <FieldRow icon={Building2} label="Department" value={ticket.department} />
                  <FieldRow icon={UserRound} label="Assigned to" value={ticket.assignee_name} />
                  <FieldRow icon={Clock} label="Created" value={formatTicketDate(ticket.created_at)} />
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <Building2 size={16} className="text-violet-300" />
                    Linked affected assets
                  </div>
                  {linkedDevices.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-zinc-500">
                      No affected devices linked to this ticket.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {linkedDevices.map((device) => (
                        <TicketDeviceBadge key={device.id} device={device} />
                      ))}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <WorkNotes comments={comments} onSubmit={addComment} loading={mutating} />

            <Card hover={false}>
              <CardHeader title="Activity Timeline" subtitle="Realtime ticket audit trail" />
              <CardBody>
                {activity.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-500">
                    No activity yet. Updates and comments will appear here.
                  </p>
                ) : (
                  <div className="relative space-y-4 before:absolute before:bottom-0 before:left-1 before:top-2 before:w-px before:bg-white/10">
                    {activity.map((item) => (
                      <ActivityItem key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card hover={false}>
              <CardHeader title="Controls" subtitle="Update ticket routing and state" />
              <CardBody className="space-y-4">
                <Select
                  label="Status"
                  value={ticket.status}
                  disabled={mutating}
                  onChange={(event) => updateFields({ status: event.target.value })}
                  options={TICKET_STATUSES}
                />
                <Select
                  label="Priority"
                  value={ticket.priority}
                  disabled={mutating}
                  onChange={(event) => updateFields({ priority: event.target.value })}
                  options={TICKET_PRIORITIES}
                />
              </CardBody>
            </Card>

            <LinkedDevicesPanel
              devices={linkedDevices}
              selectedIds={linkedDevices.map((device) => device.id)}
              onSelectionChange={updateLinkedDevices}
              onRemove={removeLinkedDevice}
              mutating={mutating}
            />

            <Card hover={false}>
              <CardHeader title="Assignment" subtitle="Owner and department" />
              <CardBody className="space-y-4">
                <Input
                  label="Assignee"
                  placeholder={ticket.assignee_name || 'Assign engineer'}
                  value={assignment.assignee_name}
                  onChange={(event) =>
                    setAssignment((prev) => ({ ...prev, assignee_name: event.target.value }))
                  }
                  disabled={mutating}
                />
                <Input
                  label="Department"
                  placeholder={ticket.department || 'IT Operations'}
                  value={assignment.department}
                  onChange={(event) =>
                    setAssignment((prev) => ({ ...prev, department: event.target.value }))
                  }
                  disabled={mutating}
                />
                <Button
                  className="w-full"
                  loading={mutating}
                  disabled={mutating || (!assignment.assignee_name && !assignment.department)}
                  onClick={handleAssignmentSave}
                >
                  Save assignment
                </Button>
              </CardBody>
            </Card>

            <Card hover={false}>
              <CardHeader title="Audit Summary" subtitle="Latest metadata" />
              <CardBody className="space-y-4">
                <FieldRow icon={Clock} label="Last updated" value={formatTicketDate(ticket.updated_at)} />
                <FieldRow icon={MessageSquare} label="Work notes" value={`${comments.length}`} />
                <FieldRow icon={FileText} label="Audit events" value={`${activity.length}`} />
              </CardBody>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
