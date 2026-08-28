import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { IncidentWorkspace } from '../components/tickets/IncidentWorkspace';
import { useTicketDetails } from '../hooks/useTicketDetails';

export default function TicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const {
    ticket,
    comments,
    activity,
    linkedDevices,
    relatedTickets,
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
        <Button className="mt-6" onClick={() => navigate('/tickets')}>
          Back to tickets
        </Button>
      </Card>
    );
  }

  return (
    <IncidentWorkspace
      ticket={ticket}
      comments={comments}
      activity={activity}
      linkedDevices={linkedDevices}
      relatedTickets={relatedTickets}
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
