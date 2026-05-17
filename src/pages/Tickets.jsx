import { useMemo, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { TicketsToolbar } from '../components/tickets/TicketsToolbar';
import { TicketsTable } from '../components/tickets/TicketsTable';
import { CreateTicketModal } from '../components/tickets/CreateTicketModal';
import { DeleteTicketModal } from '../components/tickets/DeleteTicketModal';
import { useTickets } from '../hooks/useTickets';

export default function Tickets() {
  const {
    tickets,
    loading,
    mutating,
    createTicket,
    updateStatus,
    deleteTicket,
  } = useTickets();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return (
        ticket.title?.toLowerCase().includes(query) ||
        ticket.ticket_number?.toLowerCase().includes(query) ||
        ticket.requester_name?.toLowerCase().includes(query) ||
        ticket.category?.toLowerCase().includes(query)
      );
    });
  }, [tickets, search, statusFilter]);

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return;
    const result = await deleteTicket(ticketToDelete.id);
    if (result.success) {
      setTicketToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <TicketsToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreateClick={() => setCreateOpen(true)}
        totalCount={filteredTickets.length}
      />

      <div className="mt-8">
        <TicketsTable
          tickets={filteredTickets}
          loading={loading}
          mutating={mutating}
          onStatusChange={updateStatus}
          onDelete={setTicketToDelete}
          onCreate={() => setCreateOpen(true)}
        />
      </div>

      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createTicket}
        loading={mutating}
      />

      <DeleteTicketModal
        open={Boolean(ticketToDelete)}
        onClose={() => setTicketToDelete(null)}
        ticket={ticketToDelete}
        onConfirm={handleDeleteConfirm}
        loading={mutating}
      />
    </DashboardLayout>
  );
}
