import { BrainCircuit, Repeat2, Sparkles, WandSparkles } from 'lucide-react';
import { AnalyticsCard } from '../../components/reports/AnalyticsCard';
import { ChartContainer } from '../../components/reports/ChartContainer';
import { MetricTile } from '../../components/reports/MetricTile';
import { AreaReportChart, BarReportChart, DonutReportChart } from './chartPrimitives';
import { ReportPageShell } from './ReportPageShell';

export default function AIInsightsReport() {
  return (
    <ReportPageShell
      eyebrow="AI Insights"
      title="AI Impact & Failure Intelligence"
      description="Measure AI summaries, recurring issue detection, recommendation trends and repeat incident signals."
      csvName="ai-insights.csv"
      exportRows={(data) =>
        data.tickets.map((ticket) => ({
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          category: ticket.category,
          priority: ticket.priority,
          department: ticket.department,
          ai_summary: ticket.ai_summary,
          ai_suggested_category: ticket.ai_suggested_category,
          ai_suggested_priority: ticket.ai_suggested_priority,
          ai_reasoning: ticket.ai_reasoning,
          ai_summary_generated_at: ticket.ai_summary_generated_at,
          created_at: ticket.created_at,
        }))
      }
    >
      {({ analytics }) => (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="AI summaries" value={analytics.ai.summariesCount} icon={Sparkles} tone="violet" />
            <MetricTile label="Recurring issue groups" value={analytics.ai.recurringIssues.length} icon={Repeat2} tone="amber" />
            <MetricTile label="Repeat incidents" value={analytics.ai.repeatIncidents.length} icon={BrainCircuit} tone="red" trend={-5} />
            <MetricTile label="AI recommendations" value={analytics.ai.recommendationTrend.reduce((sum, item) => sum + item.recommendations, 0)} icon={WandSparkles} tone="blue" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartContainer title="AI Recommendation Trends" subtitle="AI-assisted activity over time">
              <AreaReportChart data={analytics.ai.recommendationTrend} dataKey="recommendations" />
            </ChartContainer>
            <ChartContainer title="AI Impact Analytics" subtitle="AI assisted vs manual tickets">
              <DonutReportChart data={analytics.ai.impact} />
            </ChartContainer>
            <ChartContainer title="Common Failure Categories" subtitle="Frequent ticket categories">
              <BarReportChart data={analytics.ai.commonFailures} />
            </ChartContainer>
            <AnalyticsCard title="Repeat Incident Detection" subtitle="Devices with repeated ticket patterns" items={analytics.ai.repeatIncidents.map((row) => ({ name: row.device.name, value: row.tickets.length, detail: row.device.asset_tag }))} />
          </div>

          <AnalyticsCard title="Recurring Issue Detection" subtitle="Categories that appear repeatedly" items={analytics.ai.recurringIssues} />
        </>
      )}
    </ReportPageShell>
  );
}
