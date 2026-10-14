import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { IncidentWorkspace } from '../components/tickets/IncidentWorkspace';
import { RequesterTicketView } from '../components/tickets/RequesterTicketView';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import { useTicketDetails } from '../hooks/useTicketDetails';
import { isOwnRequest, isRequesterRole } from '../lib/portal/requesterAccess';

export default function TicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useTenant();
  const requesterMode = isRequesterRole(role);
  const {
    ticket,
    comments,
    activity,
    linkedDevices,
    relatedTickets,
    kbCitations,
    loading,
    mutating,
    aiLoading,
    updateFields,
    addComment,
    runDiagnostics,
    updateLinkedDevices,
    removeLinkedDevice,
  } = useTicketDetails(ticketId);

  if (loading) {
    return (
      <Card hover={false} className="flex min-h-[520px] items-center justify-center">
        <Spinner className="h-8 w-8 text-violet-400" />
      </Card>
    );
  }

  if (!ticket) {
    return (
      <Card hover={false} className="p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Ticket not found</h1>
        <p className="mt-2 text-sm text-zinc-400">
          This ticket may have been deleted or you may not have access.
        </p>
        <Button className="mt-6" onClick={() => navigate(requesterMode ? '/portal' : '/tickets')}>
          {requesterMode ? 'Back to my portal' : 'Back to tickets'}
        </Button>
      </Card>
    );
  }

  if (requesterMode && !isOwnRequest(ticket, user)) {
    return (
      <Card hover={false} className="p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Ticket not found</h1>
        <p className="mt-2 text-sm text-zinc-400">You can only open requests that belong to you.</p>
        <Button className="mt-6" onClick={() => navigate('/portal')}>
          Back to my portal
        </Button>
      </Card>
    );
  }

  if (requesterMode) {
    return (
      <RequesterTicketView
        ticket={ticket}
        comments={comments}
        kbCitations={kbCitations}
        mutating={mutating}
        onAddComment={addComment}
      />
    );
  }

  return (
    <IncidentWorkspace
      ticket={ticket}
      comments={comments}
      activity={activity}
      linkedDevices={linkedDevices}
      relatedTickets={relatedTickets}
      kbCitations={kbCitations}
      mutating={mutating}
      aiLoading={aiLoading}
      onUpdateFields={updateFields}
      onAddComment={addComment}
      onDiagnose={runDiagnostics}
      onUpdateLinkedDevices={updateLinkedDevices}
      onRemoveLinkedDevice={removeLinkedDevice}
    />
  );
}
