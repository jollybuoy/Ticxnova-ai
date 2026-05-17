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

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <TicketsChart />
        </div>
        <div className="lg:col-span-2">
          <DonutChartCard
            title="Tickets by Category"
            data={ticketsByCategory}
            total={23}
          />
        </div>
        <div className="lg:col-span-3">
          <AIInsights />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <RecentTickets />
        </div>
        <div className="lg:col-span-3">
          <DonutChartCard
            title="Devices Status"
            data={devicesStatus}
            total={142}
          />
        </div>
        <div className="lg:col-span-4">
          <TopUsers />
        </div>
      </div>

      <AutomationOverview />
    </DashboardLayout>
  );
}
