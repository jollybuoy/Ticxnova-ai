import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TicketsToolbar } from '../components/tickets/TicketsToolbar';
import { TicketsTable } from '../components/tickets/TicketsTable';
import { CreateTicketModal } from '../components/tickets/CreateTicketModal';
import { DeleteTicketModal } from '../components/tickets/DeleteTicketModal';
import { useTickets } from '../hooks/useTickets';
import { getTicketCounts } from '../lib/tickets/constants';

const PAGE_SIZE = 8;

export default function Tickets() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    tickets,
    loading,
    mutating,
    createTicket,
    updateStatus,
    deleteTicket,
  } = useTickets();

  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? 'all');
  const [priorityFilter, setPriorityFilter] = useState(() => searchParams.get('priority') ?? 'all');
  const [typeFilter] = useState(() => searchParams.get('type') ?? 'all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesType = typeFilter === 'all' || ticket.ticket_type === typeFilter;
      if (!matchesStatus || !matchesPriority || !matchesType) return false;
      if (!query) return true;
      return (
        ticket.title?.toLowerCase().includes(query) ||
        ticket.ticket_number?.toLowerCase().includes(query) ||
        ticket.requester_name?.toLowerCase().includes(query) ||
        ticket.requester_email?.toLowerCase().includes(query) ||
        ticket.department?.toLowerCase().includes(query) ||
        ticket.category?.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query)
      );
    });
  }, [tickets, search, statusFilter, priorityFilter, typeFilter]);

  const counts = useMemo(() => getTicketCounts(tickets), [tickets]);
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePriorityFilterChange = (value) => {
    setPriorityFilter(value);
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return;
    const result = await deleteTicket(ticketToDelete.id);
    if (result.success) {
      setTicketToDelete(null);
    }
  };

  return (
    <>
      <TicketsToolbar
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={handlePriorityFilterChange}
        counts={counts}
        onCreateClick={() => setCreateOpen(true)}
        totalCount={filteredTickets.length}
      />

      <div className="mt-8">
        <TicketsTable
          tickets={paginatedTickets}
          loading={loading}
          mutating={mutating}
          onStatusChange={updateStatus}
          onDelete={setTicketToDelete}
          onCreate={() => setCreateOpen(true)}
          onOpen={(ticket) => navigate(`/tickets/${ticket.id}`)}
          page={currentPage}
          pageSize={PAGE_SIZE}
          totalCount={filteredTickets.length}
          onPageChange={setPage}
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
    </>
  );
}
