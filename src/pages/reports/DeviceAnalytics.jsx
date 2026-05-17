import { Activity, CalendarClock, MonitorX, ShieldCheck } from 'lucide-react';
import { AnalyticsCard } from '../../components/reports/AnalyticsCard';
import { ChartContainer } from '../../components/reports/ChartContainer';
import { MetricTile } from '../../components/reports/MetricTile';
import { AreaReportChart, BarReportChart, DonutReportChart } from './chartPrimitives';
import { ReportPageShell } from './ReportPageShell';

export default function DeviceAnalytics() {
  return (
    <ReportPageShell
      eyebrow="Device Analytics"
      title="Asset Reliability Analytics"
      description="Track device health, incident frequency, warranty exposure and lifecycle reliability."
      csvName="device-analytics.csv"
      exportRows={(data, analytics) =>
        data.devices.map((device) => ({
          asset_tag: device.asset_tag,
          name: device.name,
          device_type: device.device_type,
          serial_number: device.serial_number,
          manufacturer: device.manufacturer,
          model: device.model,
          health_status: device.health_status,
          assigned_user: device.assigned_user,
          department: device.department,
          location: device.location,
          purchase_date: device.purchase_date,
          warranty_expiry: device.warranty_expiry,
          incident_count:
            analytics.devices.mostIncidents.find((row) => row.device.id === device.id)?.tickets.length ?? 0,
          created_at: device.created_at,
        }))
      }
    >
      {({ analytics }) => (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Unhealthy devices" value={analytics.devices.unhealthy.length} icon={MonitorX} tone="red" trend={-6} />
            <MetricTile label="Reliability score" value={`${Math.round(analytics.devices.reliability.reduce((s, d) => s + d.score, 0) / Math.max(1, analytics.devices.reliability.length))}%`} icon={ShieldCheck} tone="green" />
            <MetricTile label="Incident-linked assets" value={analytics.devices.mostIncidents.length} icon={Activity} tone="amber" />
            <MetricTile label="Warranty trend points" value={analytics.devices.warrantyTrend.length} icon={CalendarClock} tone="blue" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartContainer title="Devices With Most Incidents" subtitle="Highest support volume assets">
              <BarReportChart data={analytics.devices.incidentFrequency} dataKey="incidents" color="#f59e0b" />
            </ChartContainer>
            <ChartContainer title="Health Distribution" subtitle="Current endpoint posture">
              <DonutReportChart data={analytics.devices.healthDistribution} />
            </ChartContainer>
            <ChartContainer title="Warranty Expiry Trends" subtitle="Upcoming lifecycle events">
              <AreaReportChart data={analytics.devices.warrantyTrend} dataKey="expiring" color="#60a5fa" />
            </ChartContainer>
            <ChartContainer title="Device Reliability Scores" subtitle="Estimated asset reliability">
              <BarReportChart data={analytics.devices.reliability} dataKey="score" color="#34d399" />
            </ChartContainer>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AnalyticsCard title="Asset Lifecycle Analytics" subtitle="Inventory by device class" items={analytics.devices.lifecycle} />
            <AnalyticsCard title="Unhealthy Devices" subtitle="Warning, critical and offline assets" items={analytics.devices.unhealthy.map((device) => ({ name: device.name, value: device.health_status, detail: device.asset_tag }))} />
          </div>
        </>
      )}
    </ReportPageShell>
  );
}
