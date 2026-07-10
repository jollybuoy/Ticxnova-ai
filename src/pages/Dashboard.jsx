import { useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { MetricsGrid } from '../components/dashboard/MetricCard';
import { TicketsChart } from '../components/dashboard/TicketsChart';
import { DonutChartCard } from '../components/dashboard/DonutChartCard';
import { AIInsights } from '../components/dashboard/AIInsights';
import { RecentTickets } from '../components/dashboard/RecentTickets';
import { TopUsers } from '../components/dashboard/TopUsers';
import { AutomationOverview } from '../components/dashboard/AutomationOverview';
import { useDashboardData } from '../hooks/useDashboardData';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState('30');
  const dashboard = useDashboardData(dateRange);

  return (
    <>
      <DashboardHeader dateRange={dateRange} onDateRangeChange={setDateRange} />
      <MetricsGrid metrics={dashboard.metrics} />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <TicketsChart data={dashboard.ticketsTrend} />
        </div>
        <div className="xl:col-span-2">
          <DonutChartCard
            title="Tickets by Category"
            data={dashboard.ticketsByCategory}
            total={dashboard.ticketsByCategory.reduce((sum, item) => sum + item.value, 0)}
            href="/reports/tickets"
            delay={0.12}
          />
        </div>
        <div className="xl:col-span-3">
          <AIInsights insights={dashboard.aiInsights} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <RecentTickets tickets={dashboard.recentTickets} />
        </div>
        <div className="xl:col-span-3">
          <DonutChartCard
            title="Devices Status"
            data={dashboard.devicesStatus}
            total={dashboard.devicesStatus.reduce((sum, item) => sum + item.value, 0)}
            href="/devices"
            delay={0.18}
          />
        </div>
        <div className="xl:col-span-4">
          <TopUsers users={dashboard.topUsers} />
        </div>
      </section>

      <AutomationOverview automation={dashboard.automation} />
    </>
  );
}
