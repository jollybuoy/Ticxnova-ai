import { Clock3, ShieldAlert, ShieldCheck, TimerReset } from 'lucide-react';
import { AnalyticsCard } from '../../components/reports/AnalyticsCard';
import { ChartContainer } from '../../components/reports/ChartContainer';
import { MetricTile } from '../../components/reports/MetricTile';
import { BarReportChart, LineReportChart } from './chartPrimitives';
import { ReportPageShell } from './ReportPageShell';

export default function SLAReports() {
  return (
    <ReportPageShell
      eyebrow="SLA Reports"
      title="SLA Compliance Reports"
      description="Track breached tickets, response windows, resolution times and technician SLA performance."
      csvName="sla-reports.csv"
      exportRows={(data, analytics) =>
        data.tickets.map((ticket) => ({
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          technician: ticket.assignee_name,
          department: ticket.department,
          breached: analytics.sla.breachedTickets.some((item) => item.id === ticket.id) ? 'yes' : 'no',
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
        }))
      }
    >
      {({ analytics }) => (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="SLA compliance" value={`${analytics.executive.slaCompliance}%`} icon={ShieldCheck} tone="green" />
            <MetricTile label="Breached tickets" value={analytics.sla.breachedTickets.length} icon={ShieldAlert} tone="red" trend={-7} />
            <MetricTile label="MTTR" value={analytics.executive.mttr} icon={TimerReset} tone="blue" />
            <MetricTile label="Response profiles" value={analytics.sla.responseTimes.length} icon={Clock3} tone="violet" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartContainer title="Compliance Trends" subtitle="SLA compliance over time">
              <LineReportChart data={analytics.sla.complianceTrend} dataKey="compliance" />
            </ChartContainer>
            <ChartContainer title="Response Times" subtitle="Priority response profile">
              <BarReportChart data={analytics.sla.responseTimes} dataKey="hours" color="#60a5fa" />
            </ChartContainer>
            <ChartContainer title="Resolution Times" subtitle="Resolved ticket effort trend">
              <BarReportChart data={analytics.sla.resolutionTimes} dataKey="hours" color="#34d399" />
            </ChartContainer>
            <ChartContainer title="Technician SLA Performance" subtitle="Compliance by engineer">
              <BarReportChart data={analytics.sla.technicianPerformance} dataKey="compliance" color="#8b5cf6" />
            </ChartContainer>
          </div>

          <AnalyticsCard title="Breached Tickets" subtitle="Open tickets outside expected SLA windows" items={analytics.sla.breachedTickets.map((ticket) => ({ name: ticket.title, value: ticket.priority, detail: ticket.ticket_number }))} />
        </>
      )}
    </ReportPageShell>
  );
}
