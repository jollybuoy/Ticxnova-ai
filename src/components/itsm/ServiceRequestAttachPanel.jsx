import { useMemo, useState } from 'react';
import { Link2, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Select } from '../ui/Select';
import { useTickets } from '../../hooks/useTickets';

export function ServiceRequestAttachPanel({ relatedTickets, onAttach, loading }) {
  const { tickets, loading: ticketsLoading } = useTickets();
  const [ticketId, setTicketId] = useState('');

  const options = useMemo(() => {
    const attached = new Set(relatedTickets.map((ticket) => ticket.id));
    return tickets
      .filter((ticket) => ticket.ticket_type === 'service_request' && !attached.has(ticket.id))
      .map((ticket) => ({
        value: ticket.id,
        label: `${ticket.ticket_number} · ${ticket.title}`,
      }));
  }, [relatedTickets, tickets]);

  const handleAttach = async () => {
    if (!ticketId) return;
    const result = await onAttach(ticketId);
    if (result.success) setTicketId('');
  };

  return (
    <Card hover={false}>
      <CardHeader
        title="Attach Service Request"
        subtitle="Only service request tickets can be associated from the device record"
      />
      <CardBody className="space-y-4">
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-100">
          <div className="flex items-center gap-2 font-medium">
            <Link2 size={16} />
            Device service association
          </div>
          <p className="mt-2 text-xs leading-relaxed text-violet-100/80">
            Use this to attach hardware refreshes, accessory requests, provisioning, repairs, or other device-related service requests.
          </p>
        </div>

        <Select
          label="Service request"
          value={ticketId}
          onChange={(event) => setTicketId(event.target.value)}
          disabled={loading || ticketsLoading || options.length === 0}
          options={[
            {
              value: '',
              label: options.length === 0 ? 'No service requests available' : 'Select service request',
            },
            ...options,
          ]}
        />

        <Button
          className="w-full"
          loading={loading}
          disabled={loading || ticketsLoading || !ticketId}
          onClick={handleAttach}
        >
          <Plus size={16} />
          Attach service request
        </Button>
      </CardBody>
    </Card>
  );
}
