import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TicketsToolbar } from '../components/tickets/TicketsToolbar';
import { TicketsTable } from '../components/tickets/TicketsTable';
import { TicketsQueueSidebar } from '../components/tickets/TicketsQueueSidebar';
import { CreateTicketModal } from '../components/tickets/CreateTicketModal';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../hooks/useAuth';
import { getUserEmail } from '../lib/user';
import { getTicketSla } from '../lib/tickets/incidentModel';
import {
  OPEN_STATUSES,
  exportTicketsCsv,
  getOpenTickets,
  getSlaRiskTickets,
  getUnassignedTickets,
} from '../lib/tickets/queueMetrics';

const PAGE_SIZE = 25;
const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function Tickets() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const email = getUserEmail(user);
  const {
    tickets,
    loading,
    mutating,
    createTicket,
    updateStatus,
    updateFields,
    refetch,
  } = useTickets();

  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? 'queue');
  const [priorityFilter, setPriorityFilter] = useState(() => searchParams.get('priority') ?? 'all');
  const [quickFilter, setQuickFilter] = useState(() => searchParams.get('quick') ?? 'all');
  const [sort, setSort] = useState('updated');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setStatusFilter(searchParams.get('status') ?? 'queue');
    setPriorityFilter(searchParams.get('priority') ?? 'all');
    setQuickFilter(searchParams.get('quick') ?? 'all');
  }, [searchParams]);

  const openTickets = useMemo(() => getOpenTickets(tickets), [tickets]);
  const slaRisk = useMemo(() => getSlaRiskTickets(tickets), [tickets]);
  const unassigned = useMemo(() => getUnassignedTickets(tickets), [tickets]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const next = tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'queue' ? OPEN_STATUSES.includes(ticket.status) : ticket.status === statusFilter);
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      if (!matchesStatus || !matchesPriority) return false;

      if (quickFilter === 'mine') {
        const mine =
          ticket.requester_email === email ||
          ticket.assignee_name?.toLowerCase().includes((user?.user_metadata?.full_name || '').toLowerCase());
        if (!mine) return false;
      }
      if (quickFilter === 'unassigned' && ticket.assignee_name?.trim()) return false;
      if (quickFilter === 'p1' && ticket.priority !== 'urgent') return false;
      if (quickFilter === 'sla') {
        const sla = getTicketSla(ticket);
        if (!(sla.atRisk || sla.breached) || ticket.status === 'resolved') return false;
      }
      if (quickFilter === 'today') {
        if (new Date(ticket.updated_at || ticket.created_at) < start) return false;
      }

      if (!query) return true;
      return (
        ticket.title?.toLowerCase().includes(query) ||
        ticket.ticket_number?.toLowerCase().includes(query) ||
        ticket.requester_name?.toLowerCase().includes(query) ||
        ticket.requester_email?.toLowerCase().includes(query) ||
        ticket.assignee_name?.toLowerCase().includes(query) ||
        ticket.department?.toLowerCase().includes(query) ||
        ticket.category?.toLowerCase().includes(query)
      );
    });

    return next.sort((a, b) => {
      if (sort === 'priority') return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
      if (sort === 'sla') return getTicketSla(a).remainingMs - getTicketSla(b).remainingMs;
      return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
    });
  }, [email, priorityFilter, quickFilter, search, sort, statusFilter, tickets, user]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const syncParams = (key, value) => {
    const next = new URLSearchParams(searchParams);
    const isDefault =
      !value ||
      (key === 'status' && value === 'queue') ||
      (key !== 'status' && value === 'all');
    if (isDefault) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <TicketsToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
          syncParams('search', value);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
          syncParams('status', value);
        }}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={(value) => {
          setPriorityFilter(value);
          setPage(1);
          syncParams('priority', value);
        }}
        sort={sort}
        onSortChange={(value) => {
          setSort(value);
          setPage(1);
        }}
        quickFilter={quickFilter}
        onQuickFilterChange={(value) => {
          setQuickFilter(value);
          setPage(1);
          syncParams('quick', value);
        }}
        onCreateClick={() => setCreateOpen(true)}
        onExport={() => exportTicketsCsv(filteredTickets)}
        totalCount={filteredTickets.length}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <TicketsTable
          tickets={paginatedTickets}
          loading={loading}
          mutating={mutating}
          selectedIds={selectedIds}
          onToggle={(id) =>
            setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
          }
          onToggleAll={() =>
            setSelectedIds((prev) =>
              paginatedTickets.every((ticket) => prev.includes(ticket.id))
                ? prev.filter((id) => !paginatedTickets.some((ticket) => ticket.id === id))
                : [...new Set([...prev, ...paginatedTickets.map((ticket) => ticket.id)])],
            )
          }
          onOpen={(ticket) => navigate(`/tickets/${ticket.id}`)}
          onCreate={() => setCreateOpen(true)}
          onBulkStatus={async (status) => {
            await Promise.all(selectedIds.map((id) => updateStatus(id, status)));
            setSelectedIds([]);
          }}
          onBulkAssign={async (name) => {
            await Promise.all(selectedIds.map((id) => updateFields(id, { assignee_name: name })));
            setSelectedIds([]);
          }}
          onAddNote={() => {
            if (selectedIds[0]) navigate(`/tickets/${selectedIds[0]}`);
          }}
          page={currentPage}
          pageSize={PAGE_SIZE}
          totalCount={filteredTickets.length}
          onPageChange={setPage}
        />
        <TicketsQueueSidebar
          open={openTickets.length}
          unassigned={unassigned.length}
          slaRisk={slaRisk.length}
          onRefresh={refetch}
        />
      </div>

      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createTicket}
        loading={mutating}
      />
    </>
  );
}
