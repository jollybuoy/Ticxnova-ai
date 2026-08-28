import { useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { MetricsGrid } from '../components/dashboard/MetricCard';
import { TicketsChart } from '../components/dashboard/TicketsChart';
import { AIInsights } from '../components/dashboard/AIInsights';
import { RecentTickets } from '../components/dashboard/RecentTickets';
import { TopUsers } from '../components/dashboard/TopUsers';
import { AutomationOverview } from '../components/dashboard/AutomationOverview';
import { CreateTicketModal } from '../components/tickets/CreateTicketModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTickets } from '../hooks/useTickets';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState('7');
  const [createOpen, setCreateOpen] = useState(false);
  const dashboard = useDashboardData(dateRange);
  const { createTicket, mutating } = useTickets();

  return (
    <>
      <DashboardHeader
        greeting={dashboard.greeting}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onCreateClick={() => setCreateOpen(true)}
      />
      <MetricsGrid metrics={dashboard.metrics} />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <TicketsChart data={dashboard.weekBars} />
        </div>
        <div className="xl:col-span-4">
          <AIInsights insights={dashboard.brief} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <RecentTickets tickets={dashboard.priorityQueue} />
        </div>
        <div className="xl:col-span-3">
          <TopUsers users={dashboard.team} />
        </div>
        <div className="xl:col-span-3">
          <AutomationOverview activity={dashboard.activity} />
        </div>
      </section>

      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createTicket}
        loading={mutating}
      />
    </>
  );
}
