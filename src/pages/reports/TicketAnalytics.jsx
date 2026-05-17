import { AnalyticsCard } from '../../components/reports/AnalyticsCard';
import { ChartContainer } from '../../components/reports/ChartContainer';
import { MetricTile } from '../../components/reports/MetricTile';
import { AreaReportChart, BarReportChart, DonutReportChart, HeatmapGrid } from './chartPrimitives';
import { ReportPageShell } from './ReportPageShell';
import { Clock3, GitPullRequest, Layers, Users } from 'lucide-react';

export default function TicketAnalytics() {
  return (
    <ReportPageShell
      eyebrow="Ticket Analytics"
      title="Ticket Operations Analytics"
      description="Analyze volume, aging, priority mix, department demand and technician workload."
      csvName="ticket-analytics.csv"
      exportRows={(data) =>
        data.tickets.map((ticket) => ({
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          description: ticket.description,
          type: ticket.ticket_type,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          requester: ticket.requester_name,
          technician: ticket.assignee_name,
          department: ticket.department,
          ai_summary: ticket.ai_summary,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
        }))
      }
    >
      {({ analytics }) => (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Ticket volume" value={analytics.executive.totalTickets} icon={Layers} />
            <MetricTile label="Open incidents" value={analytics.executive.openIncidents} icon={GitPullRequest} tone="amber" />
            <MetricTile label="Aging risk" value={analytics.tickets.ticketAging.at(-1)?.value ?? 0} icon={Clock3} tone="red" trend={-3} />
            <MetricTile label="Technicians" value={analytics.tickets.technicianWorkload.length} icon={Users} tone="blue" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartContainer title="Open vs Closed Trends" subtitle="Daily ticket movement">
              <AreaReportChart data={analytics.tickets.openClosedTrend} dataKey="tickets" />
            </ChartContainer>
            <ChartContainer title="Priority Distribution" subtitle="Priority mix">
              <DonutReportChart data={analytics.tickets.priorityDistribution} />
            </ChartContainer>
            <ChartContainer title="Category Breakdown" subtitle="Common request categories">
              <BarReportChart data={analytics.tickets.categoryBreakdown} />
            </ChartContainer>
            <ChartContainer title="Ticket Aging" subtitle="Current open ticket age buckets">
              <BarReportChart data={analytics.tickets.ticketAging} color="#f59e0b" />
            </ChartContainer>
            <ChartContainer title="Resolution Trends" subtitle="Resolved tickets over time">
              <AreaReportChart data={analytics.tickets.resolutionTrend} dataKey="resolved" color="#34d399" />
            </ChartContainer>
            <ChartContainer title="Incident Heatmap" subtitle="Department demand heatmap">
              <HeatmapGrid rows={analytics.tickets.heatmap} />
            </ChartContainer>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AnalyticsCard title="Department Analytics" subtitle="Demand by business unit" items={analytics.tickets.departmentAnalytics} />
            <AnalyticsCard title="Technician Workload" subtitle="Assigned work by engineer" items={analytics.tickets.technicianWorkload} />
          </div>
        </>
      )}
    </ReportPageShell>
  );
}
