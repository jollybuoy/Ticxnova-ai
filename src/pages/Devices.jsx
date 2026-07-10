import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, TriangleAlert, Wrench } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DeviceFormModal } from '../components/devices/DeviceFormModal';
import { DevicesGrid } from '../components/devices/DevicesGrid';
import { DevicesTable } from '../components/devices/DevicesTable';
import { DevicesToolbar } from '../components/devices/DevicesToolbar';
import { useDevices } from '../hooks/useDevices';
import { useTickets } from '../hooks/useTickets';
import { getDeviceStats } from '../lib/devices/constants';

const pageSize = 9;

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    violet: 'from-violet-500/20 to-indigo-500/10 text-violet-200',
    green: 'from-emerald-500/20 to-cyan-500/10 text-emerald-200',
    amber: 'from-amber-500/20 to-orange-500/10 text-amber-200',
  };
  return (
    <Card hover={false}>
      <CardBody className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export default function Devices() {
  const [searchParams] = useSearchParams();
  const { devices, loading, mutating, createDevice, updateDevice, deleteDevice } = useDevices();
  const { tickets } = useTickets();
  const [query, setQuery] = useState(() => searchParams.get('search') ?? '');
  const [status, setStatus] = useState(() => searchParams.get('status') ?? 'all');
  const [type, setType] = useState('all');
  const [view, setView] = useState('table');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  const stats = useMemo(() => getDeviceStats(devices), [devices]);
  const serviceRequestOptions = useMemo(
    () =>
      tickets
        .filter((ticket) => ticket.ticket_type === 'service_request')
        .map((ticket) => ({
          value: ticket.id,
          label: `${ticket.ticket_number} · ${ticket.title}`,
        })),
    [tickets],
  );

  const filteredDevices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return devices.filter((device) => {
      const matchesQuery =
        !normalized ||
        [
          device.name,
          device.asset_tag,
          device.serial_number,
          device.assigned_user,
          device.department,
          device.device_type,
          device.manufacturer,
          device.model,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalized));
      const matchesStatus = status === 'all' || device.health_status === status;
      const matchesType = type === 'all' || device.device_type === type;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [devices, query, status, type]);

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / pageSize));
  const pagedDevices = filteredDevices.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditingDevice(null);
    setModalOpen(true);
  };

  const openEdit = (device) => {
    setEditingDevice(device);
    setModalOpen(true);
  };

  const submitDevice = (payload) => {
    if (editingDevice) {
      return updateDevice(editingDevice, {
        asset_tag: payload.asset_tag || editingDevice.asset_tag,
        name: payload.name,
        device_type: payload.device_type,
        serial_number: payload.serial_number || null,
        assigned_user: payload.assigned_user || null,
        department: payload.department || null,
        location: payload.location || null,
        manufacturer: payload.manufacturer || null,
        model: payload.model || null,
        purchase_date: payload.purchase_date || null,
        warranty_expiry: payload.warranty_expiry || null,
        health_status: payload.health_status,
        notes: payload.notes || null,
      });
    }
    return createDevice(payload);
  };

  const confirmDelete = async (device) => {
    if (!window.confirm(`Delete ${device.name}? This removes notes and activity too.`)) return;
    await deleteDevice(device.id);
  };

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-label">Asset & Device Management</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Device Inventory</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Track endpoints, ownership, departments, warranty exposure and health across managed clients.
          </p>
        </div>
        <Button onClick={openCreate}>Add device</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={ShieldCheck} label="Total devices" value={stats.total} tone="violet" />
        <StatCard icon={TriangleAlert} label="Unhealthy devices" value={stats.unhealthy} tone="amber" />
        <StatCard icon={Wrench} label="Warranty alerts" value={stats.warrantyAlerts} tone="green" />
      </div>

      <DevicesToolbar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        type={type}
        onTypeChange={(value) => {
          setType(value);
          setPage(1);
        }}
        view={view}
        onViewChange={setView}
        onCreate={openCreate}
      />

      {loading ? (
        <div className="glass-card px-6 py-12 text-center text-sm text-zinc-500">Loading device inventory...</div>
      ) : view === 'table' ? (
        <DevicesTable devices={pagedDevices} onEdit={openEdit} onDelete={confirmDelete} />
      ) : (
        <DevicesGrid devices={pagedDevices} onEdit={openEdit} onDelete={confirmDelete} />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          Showing {pagedDevices.length} of {filteredDevices.length} devices
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
            Previous
          </Button>
          <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>
            Next
          </Button>
        </div>
      </div>

      <DeviceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        device={editingDevice}
        onSubmit={submitDevice}
        loading={mutating}
        serviceRequestOptions={serviceRequestOptions}
      />
    </>
  );
}
