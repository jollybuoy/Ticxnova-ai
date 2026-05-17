import { BrainCircuit, Clock3, MonitorX, Repeat2, ShieldCheck, Ticket, TicketCheck, TriangleAlert } from 'lucide-react';
import { ChartContainer } from '../../components/reports/ChartContainer';
import { ExecutiveSummary } from '../../components/reports/ExecutiveSummary';
import { MetricTile } from '../../components/reports/MetricTile';
import { AreaReportChart, BarReportChart, DonutReportChart } from './chartPrimitives';
import { ReportPageShell } from './ReportPageShell';

export default function ReportsDashboard() {
  return (
    <ReportPageShell
      eyebrow="Reports & Analytics"
      title="Executive Reports Dashboard"
      description="Realtime operational command center for tickets, assets, AI impact and SLA posture."
      csvName="reports-dashboard.csv"
      exportRows={(data, analytics) => [
        { section: 'Executive Summary', ...analytics.executive },
        ...data.tickets.map((ticket) => ({
          section: 'Ticket Detail',
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          type: ticket.ticket_type,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          department: ticket.department,
          technician: ticket.assignee_name,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
        })),
        ...data.devices.map((device) => ({
          section: 'Device Detail',
          asset_tag: device.asset_tag,
          name: device.name,
          device_type: device.device_type,
          health_status: device.health_status,
          department: device.department,
          assigned_user: device.assigned_user,
          warranty_expiry: device.warranty_expiry,
        })),
      ]}
    >
      {({ analytics }) => (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total tickets" value={analytics.executive.totalTickets} icon={Ticket} tone="violet" />
            <MetricTile label="Open incidents" value={analytics.executive.openIncidents} icon={TriangleAlert} tone="amber" trend={-4} />
            <MetricTile label="Resolved tickets" value={analytics.executive.resolvedTickets} icon={TicketCheck} tone="green" />
            <MetricTile label="SLA compliance" value={`${analytics.executive.slaCompliance}%`} icon={ShieldCheck} tone="blue" />
            <MetricTile label="MTTR" value={analytics.executive.mttr} icon={Clock3} tone="green" />
            <MetricTile label="AI-assisted" value={analytics.executive.aiAssisted} icon={BrainCircuit} tone="violet" />
            <MetricTile label="Critical devices" value={analytics.executive.criticalDevices} icon={MonitorX} tone="red" trend={-8} />
            <MetricTile label="Recurring failures" value={analytics.executive.recurringFailures} icon={Repeat2} tone="amber" trend={-2} />
          </div>

          <ExecutiveSummary analytics={analytics} />

          <div className="grid gap-6 xl:grid-cols-3">
            <ChartContainer title="Open vs Closed Trend" subtitle="Ticket volume trajectory">
              <AreaReportChart data={analytics.tickets.openClosedTrend} dataKey="tickets" />
            </ChartContainer>
            <ChartContainer title="Priority Distribution" subtitle="Severity mix">
              <DonutReportChart data={analytics.tickets.priorityDistribution} />
            </ChartContainer>
            <ChartContainer title="Critical Asset Risk" subtitle="Unhealthy asset count by status">
              <BarReportChart data={analytics.devices.healthDistribution} />
            </ChartContainer>
          </div>
        </>
      )}
    </ReportPageShell>
  );
}
