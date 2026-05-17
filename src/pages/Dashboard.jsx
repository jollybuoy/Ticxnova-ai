import { DashboardLayout } from '../components/layout/DashboardLayout';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { MetricsGrid } from '../components/dashboard/MetricCard';
import { TicketsChart } from '../components/dashboard/TicketsChart';
import { DonutChartCard } from '../components/dashboard/DonutChartCard';
import { AIInsights } from '../components/dashboard/AIInsights';
import { RecentTickets } from '../components/dashboard/RecentTickets';
import { TopUsers } from '../components/dashboard/TopUsers';
import { AutomationOverview } from '../components/dashboard/AutomationOverview';
import {
  metrics,
  ticketsByCategory,
  devicesStatus,
} from '../data/dummyData';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <MetricsGrid metrics={metrics} />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <TicketsChart />
        </div>
        <div className="xl:col-span-2">
          <DonutChartCard
            title="Tickets by Category"
            data={ticketsByCategory}
            total={23}
            delay={0.12}
          />
        </div>
        <div className="xl:col-span-3">
          <AIInsights />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <RecentTickets />
        </div>
        <div className="xl:col-span-3">
          <DonutChartCard
            title="Devices Status"
            data={devicesStatus}
            total={142}
            delay={0.18}
          />
        </div>
        <div className="xl:col-span-4">
          <TopUsers />
        </div>
      </section>

      <AutomationOverview />
    </DashboardLayout>
  );
}
