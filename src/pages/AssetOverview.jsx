import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Package,
  Plus,
  Search,
  ShieldAlert,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { KpiCard } from '../components/ui/KpiCard';
import { UserAvatar } from '../components/ui/UserAvatar';
import { Spinner } from '../components/ui/Spinner';
import { ChartTooltip } from '../components/ui/ChartTooltip';
import { DonutChartCard } from '../components/dashboard/DonutChartCard';
import { AiInsightPanel } from '../components/ai/AiInsightPanel';
import { DeviceFormModal } from '../components/devices/DeviceFormModal';
import { useDevices } from '../hooks/useDevices';
import { useTickets } from '../hooks/useTickets';
import { formatAge } from '../lib/tickets/incidentModel';
import {
  categoryDistribution,
  deviceAlerts,
  getFleetBreakdown,
  isCompliant,
  lastSeen,
  lifecycleLabel,
  lifecycleTrend,
} from '../lib/devices/fleetMetrics';
import { formatDeviceDate, isWarrantyExpiring } from '../lib/devices/constants';

const PAGE_SIZE = 8;
const HARDWARE_TYPES = ['Laptop', 'Desktop', 'Server', 'Network Device', 'Mobile Device'];

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'software', label: 'Software' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'vendors', label: 'Vendors' },
];

function lifecycleBadge(device) {
  return lifecycleLabel(device) === 'In use' ? 'green' : 'blue';
}

export default function AssetOverview() {
  const navigate = useNavigate();
  const { devices, loading, mutating, createDevice } = useDevices();
  const { tickets } = useTickets();
  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const fleet = useMemo(() => getFleetBreakdown(devices), [devices]);
  const categories = useMemo(() => categoryDistribution(devices), [devices]);
  const trend = useMemo(() => lifecycleTrend(devices), [devices]);
  const alerts = useMemo(() => deviceAlerts(devices), [devices]);
  const serviceRequestOptions = useMemo(
    () =>
      tickets
        .filter((ticket) => ticket.ticket_type === 'service_request')
        .map((ticket) => ({ value: ticket.id, label: `${ticket.ticket_number} · ${ticket.title}` })),
    [tickets],
  );

  const scoped = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return devices.filter((device) => {
      if (tab === 'hardware' && !HARDWARE_TYPES.includes(device.device_type)) return false;
      if (tab === 'contracts' && !isWarrantyExpiring(device)) return false;
      if (!normalized) return true;
      return [device.name, device.asset_tag, device.assigned_user, device.location, device.manufacturer, device.model]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized));
    });
  }, [devices, query, tab]);

  const vendors = useMemo(() => {
    const groups = new Map();
    devices.forEach((device) => {
      const name = device.manufacturer?.trim() || 'Unknown vendor';
      groups.set(name, (groups.get(name) ?? 0) + 1);
    });
    return [...groups.entries()].sort((a, b) => b[1] - a[1]);
  }, [devices]);

  const totalPages = Math.max(1, Math.ceil(scoped.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = scoped.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const recent = [...devices]
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 6);

  const exportCsv = () => {
    const header = ['Asset ID', 'Name', 'Type', 'Owner', 'Location', 'Lifecycle', 'Warranty'];
    const csv = [header, ...scoped.map((device) => [device.asset_tag, device.name, device.device_type, device.assigned_user || '', device.location || '', lifecycleLabel(device), device.warranty_expiry || ''])]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticxnova-assets-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Assets</h1>
          <p className="mt-1 text-sm text-zinc-400">Inventory, lifecycle, and warranty intelligence.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={exportCsv}>
            <Download size={16} />
            Export
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Add asset
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-white/15 pb-px">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setPage(1);
            }}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.id ? 'border-violet-400 text-white' : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={Boxes} label="Total assets" value={fleet.total} hint="Managed inventory" iconBg="bg-violet-500/15 text-violet-300" />
          <KpiCard icon={UserRound} label="Assigned" value={fleet.assigned} hint={`${fleet.total ? Math.round((fleet.assigned / fleet.total) * 100) : 0}% in use`} iconBg="bg-blue-500/15 text-blue-300" color="#60a5fa" />
          <KpiCard icon={Package} label="In stock" value={fleet.inStock} hint="Unassigned hardware" iconBg="bg-emerald-500/15 text-emerald-300" color="#34d399" />
          <KpiCard icon={TriangleAlert} label="Warranty expiring" value={fleet.warranty} hint="Next 60 days" iconBg="bg-orange-500/15 text-orange-300" color="#fb923c" />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search assets..."
            className="focus-ring w-full rounded-xl border border-white/15 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <Button variant="secondary" onClick={() => navigate('/devices')}>
          <Filter size={16} />
          Open devices
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {tab === 'software' ? (
            <Card hover={false} className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-white">Software inventory is not connected yet</p>
              <p className="mt-2 text-sm text-zinc-500">License and SAM data will appear here once a software source is linked.</p>
            </Card>
          ) : tab === 'vendors' ? (
            <Card hover={false} className="overflow-hidden p-0">
              <CardHeader title="Vendors" subtitle="Manufacturers in the current inventory" />
              <CardBody className="space-y-3">
                {vendors.length === 0 ? (
                  <p className="text-sm text-zinc-500">No vendor data yet.</p>
                ) : (
                  vendors.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
                      <p className="text-sm text-white">{name}</p>
                      <span className="text-sm tabular-nums text-zinc-400">{count}</span>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          ) : loading ? (
            <Card hover={false} className="flex min-h-[320px] items-center justify-center">
              <Spinner className="h-8 w-8 text-violet-400" />
            </Card>
          ) : (
            <Card hover={false} className="overflow-hidden p-0">
              <CardHeader title="Asset inventory" subtitle={`${scoped.length} records in this view`} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead>
                    <tr className="border-y border-white/15 text-[11px] uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3">Asset ID</th>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Lifecycle</th>
                      <th className="px-4 py-3">Compliance</th>
                      <th className="px-4 py-3">Last seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((device) => (
                      <tr
                        key={device.id}
                        className="cursor-pointer border-b border-white/10 last:border-0 hover:bg-white/[0.03]"
                        onClick={() => navigate(`/devices/${device.id}`)}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-violet-300">{device.asset_tag}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-white">{device.name}</p>
                          <p className="text-xs text-zinc-500">
                            {[device.manufacturer, device.model].filter(Boolean).join(' · ') || device.device_type}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{device.device_type}</td>
                        <td className="px-4 py-3">
                          {device.assigned_user ? (
                            <span className="inline-flex items-center gap-2 text-sm text-zinc-200">
                              <UserAvatar name={device.assigned_user} />
                              {device.assigned_user}
                            </span>
                          ) : (
                            <span className="text-sm text-zinc-500">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{device.location || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={lifecycleBadge(device)}>{lifecycleLabel(device)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {isCompliant(device) ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300">
                              <CheckCircle2 size={14} />
                              Compliant
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm text-red-300">
                              <ShieldAlert size={14} />
                              Non-compliant
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{lastSeen(device)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-white/15 px-4 py-3 text-xs text-zinc-500">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, scoped.length)} of {scoped.length} assets
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-white/15 p-1.5 disabled:opacity-40">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-violet-600 px-2 font-semibold text-white">{currentPage}</span>
                  <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-white/15 p-1.5 disabled:opacity-40">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </Card>
          )}

          {tab === 'overview' && (
            <div className="grid gap-5 xl:grid-cols-2">
              <DonutChartCard title="Category distribution" data={categories} total={fleet.total} totalLabel="Assets" />
              <Card hover={false} className="min-h-[360px]">
                <CardHeader title="Lifecycle trend" subtitle="In use vs in stock from current inventory" />
                <CardBody className="h-[280px] pt-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="inUse" stroke="#8b5cf6" fill="rgba(139,92,246,0.2)" strokeWidth={2} />
                      <Area type="monotone" dataKey="inStock" stroke="#34d399" fill="rgba(52,211,153,0.12)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <AiInsightPanel
            title="Asset intelligence"
            subtitle="Risk, warranty, and idle stock"
            gauges={[
              {
                label: 'Lifecycle risk',
                value: fleet.unmanagedRisk,
                max: Math.max(1, fleet.total),
                display: `${fleet.total ? Math.round((fleet.unmanagedRisk / fleet.total) * 100) : 0}%`,
                color: '#fb7185',
              },
              { label: 'Expiring', value: fleet.warranty, max: Math.max(1, fleet.total), display: fleet.warranty, color: '#fb923c' },
              { label: 'Unassigned', value: fleet.inStock, max: Math.max(1, fleet.total), display: fleet.inStock, color: '#34d399' },
            ]}
            alerts={alerts}
            cta="Review savings"
            onCta={() => {
              setTab('contracts');
              setPage(1);
            }}
          />
          <Card hover={false} className="p-0">
            <CardHeader title="Recent changes" subtitle="Latest inventory movement" />
            <CardBody className="space-y-4">
              {recent.length === 0 ? (
                <p className="text-sm text-zinc-500">No recent asset activity.</p>
              ) : (
                recent.map((device) => (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => navigate(`/devices/${device.id}`)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${device.health_status === 'Healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">{device.name}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {lifecycleLabel(device)} · {formatDeviceDate(device.updated_at || device.created_at)}
                      </span>
                    </span>
                    <span className="text-xs text-zinc-500">{formatAge(device.updated_at || device.created_at)}</span>
                  </button>
                ))
              )}
            </CardBody>
          </Card>
        </aside>
      </div>

      <DeviceFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={createDevice} loading={mutating} serviceRequestOptions={serviceRequestOptions} />
    </>
  );
}
