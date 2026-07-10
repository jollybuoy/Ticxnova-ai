import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, CalendarClock, Server, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { DonutChartCard } from '../components/dashboard/DonutChartCard';
import { ChartTooltip } from '../components/ui/ChartTooltip';
import { DeviceStatusBadge } from '../components/devices/DeviceStatusBadge';
import { useDevices } from '../hooks/useDevices';
import { useAssetIncidents } from '../hooks/useAssetIncidents';
import { formatDeviceDate, getDeviceStats, isWarrantyExpiring } from '../lib/devices/constants';

function percentData(items, total) {
  return items.map((item) => ({
    ...item,
    percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }));
}

function Metric({ label, value, icon: Icon, tone }) {
  return (
    <Card hover={false}>
      <CardBody className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className={`rounded-2xl border border-white/10 p-3 ${tone}`}>
          <Icon size={22} />
        </div>
      </CardBody>
    </Card>
  );
}

export default function AssetOverview() {
  const { devices, loading } = useDevices();
  const { analytics } = useAssetIncidents();
  const stats = getDeviceStats(devices);
  const statusData = percentData(stats.byStatus, stats.total);
  const warrantyDevices = devices.filter(isWarrantyExpiring).slice(0, 6);
  const trendData = [
    { name: 'Jan', devices: Math.max(0, stats.total - 8), unhealthy: Math.max(0, stats.unhealthy - 2) },
    { name: 'Feb', devices: Math.max(0, stats.total - 6), unhealthy: Math.max(0, stats.unhealthy - 1) },
    { name: 'Mar', devices: Math.max(0, stats.total - 4), unhealthy: stats.unhealthy },
    { name: 'Apr', devices: Math.max(0, stats.total - 3), unhealthy: stats.unhealthy },
    { name: 'May', devices: stats.total, unhealthy: stats.unhealthy },
  ];

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-label">Asset Overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Managed Asset Intelligence</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Executive device posture, lifecycle risk and distribution analytics for MSP operations.
          </p>
        </div>
        <Link
          to="/devices"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/25 transition-colors hover:shadow-violet-600/40"
        >
          Open inventory <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total devices" value={stats.total} icon={Server} tone="bg-violet-500/15 text-violet-200" />
        <Metric label="Healthy devices" value={stats.total - stats.unhealthy} icon={ShieldCheck} tone="bg-emerald-500/15 text-emerald-200" />
        <Metric label="Unhealthy devices" value={stats.unhealthy} icon={TriangleAlert} tone="bg-amber-500/15 text-amber-200" />
        <Metric label="Warranty alerts" value={stats.warrantyAlerts} icon={CalendarClock} tone="bg-cyan-500/15 text-cyan-200" />
      </div>

      {loading ? (
        <div className="glass-card px-6 py-12 text-center text-sm text-zinc-500">Loading asset intelligence...</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <DonutChartCard title="Health Distribution" data={statusData} total={stats.total} totalLabel="Devices" />

          <Card className="min-h-[360px]">
            <CardHeader title="Device Type Distribution" subtitle="Assets grouped by inventory class" />
            <CardBody className="h-[285px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader title="Fleet Trend" subtitle="Illustrative monthly posture trend from current inventory" />
            <CardBody className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="devicesGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="unhealthyGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="devices" stroke="#8b5cf6" fill="url(#devicesGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="unhealthy" stroke="#f59e0b" fill="url(#unhealthyGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader title="Warranty & Lifecycle Alerts" subtitle="Devices expiring soon or already expired" />
        <CardBody>
          <div className="space-y-3">
            {warrantyDevices.length === 0 ? (
              <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-5 text-sm text-zinc-500">
                No warranty alerts in the current inventory.
              </p>
            ) : (
              warrantyDevices.map((device) => (
                <Link
                  key={device.id}
                  to={`/devices/${device.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 transition-colors hover:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{device.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {device.asset_tag} · {device.assigned_user || 'Unassigned'} · Warranty {formatDeviceDate(device.warranty_expiry)}
                    </p>
                  </div>
                  <DeviceStatusBadge status={device.health_status} />
                </Link>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card hover={false}>
          <CardHeader title="Devices With Most Incidents" subtitle="Highest support volume by asset" />
          <CardBody className="space-y-3">
            {analytics.devicesWithMostIncidents.length === 0 ? (
              <p className="text-sm text-zinc-500">No linked incident history yet.</p>
            ) : (
              analytics.devicesWithMostIncidents.map((row) => (
                <Link key={row.device.id} to={`/devices/${row.device.id}`} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 hover:bg-white/[0.06]">
                  <div>
                    <p className="text-sm font-semibold text-white">{row.device.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{row.device.asset_tag}</p>
                  </div>
                  <span className="text-lg font-semibold text-violet-200">{row.tickets.length}</span>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card hover={false}>
          <CardHeader title="Recurring Failures" subtitle="Assets with repeated ticket patterns" />
          <CardBody className="space-y-3">
            {analytics.recurringFailures.length === 0 ? (
              <p className="text-sm text-zinc-500">No recurring failure pattern detected.</p>
            ) : (
              analytics.recurringFailures.map((row) => (
                <Link key={row.device.id} to={`/devices/${row.device.id}`} className="block rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 hover:bg-amber-500/15">
                  <p className="text-sm font-semibold text-white">{row.device.name}</p>
                  <p className="mt-1 text-xs text-amber-200">{row.tickets.length} historical incidents. Review replacement eligibility.</p>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card hover={false}>
          <CardHeader title="Unhealthy Assets With Open Tickets" subtitle="Critical operational risk queue" />
          <CardBody className="space-y-3">
            {analytics.unhealthyAssetsWithOpenTickets.length === 0 ? (
              <p className="text-sm text-zinc-500">No unhealthy assets with open tickets.</p>
            ) : (
              analytics.unhealthyAssetsWithOpenTickets.map((row) => (
                <Link key={row.device.id} to={`/devices/${row.device.id}`} className="block rounded-2xl border border-red-500/20 bg-red-500/10 p-4 hover:bg-red-500/15">
                  <p className="text-sm font-semibold text-white">{row.device.name}</p>
                  <p className="mt-1 text-xs text-red-200">{row.openTickets.length} active issue(s) · {row.device.health_status}</p>
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
