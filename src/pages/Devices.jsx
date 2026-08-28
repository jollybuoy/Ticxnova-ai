import { useMemo, useState } from 'react';
import { Laptop, ShieldAlert, ShieldCheck, TriangleAlert, WifiOff } from 'lucide-react';
import { DeviceFormModal } from '../components/devices/DeviceFormModal';
import { DeviceInspector } from '../components/devices/DeviceInspector';
import { DevicesTable } from '../components/devices/DevicesTable';
import { DevicesToolbar } from '../components/devices/DevicesToolbar';
import { CreateTicketModal } from '../components/tickets/CreateTicketModal';
import { KpiCard } from '../components/ui/KpiCard';
import { useDevices } from '../hooks/useDevices';
import { useTickets } from '../hooks/useTickets';
import { DEVICE_TYPES } from '../lib/devices/constants';
import { deviceAlerts, getFleetBreakdown } from '../lib/devices/fleetMetrics';

const PAGE_SIZE = 10;

export default function Devices() {
  const { devices, loading, mutating, createDevice, updateDevice } = useDevices();
  const { tickets, createTicket, mutating: ticketMutating } = useTickets();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const fleet = useMemo(() => getFleetBreakdown(devices), [devices]);
  const alerts = useMemo(() => deviceAlerts(devices), [devices]);
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
        [device.name, device.asset_tag, device.serial_number, device.assigned_user, device.department, device.device_type, device.manufacturer, device.model]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalized));
      const matchesStatus =
        status === 'all' ||
        (status === 'risk'
          ? ['Warning', 'Critical', 'Offline'].includes(device.health_status)
          : device.health_status === status);
      const matchesType = type === 'all' || device.device_type === type;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [devices, query, status, type]);

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedDevices = filteredDevices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedDevice = devices.find((device) => device.id === selectedId) || pagedDevices[0] || null;

  const openCreate = () => {
    setEditingDevice(null);
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

  const kpis = [
    { id: 'all', label: 'Managed', value: fleet.total, hint: 'Enrolled endpoints', icon: Laptop, iconBg: 'bg-violet-500/15 text-violet-300', color: '#8b5cf6' },
    { id: 'Healthy', label: 'Healthy', value: fleet.healthy, hint: `${fleet.total ? Math.round((fleet.healthy / fleet.total) * 100) : 0}% of fleet`, icon: ShieldCheck, iconBg: 'bg-emerald-500/15 text-emerald-300', color: '#34d399' },
    { id: 'Warning', label: 'Need attention', value: fleet.attention, hint: 'Warning status', icon: TriangleAlert, iconBg: 'bg-amber-500/15 text-amber-300', color: '#fbbf24' },
    { id: 'Critical', label: 'Critical', value: fleet.critical, hint: 'Immediate review', icon: ShieldAlert, iconBg: 'bg-red-500/15 text-red-300', color: '#f87171' },
    { id: 'Offline', label: 'Offline', value: fleet.offline, hint: 'Not checking in', icon: WifiOff, iconBg: 'bg-zinc-500/15 text-zinc-300', color: '#94a3b8' },
  ];

  return (
    <>
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
        types={DEVICE_TYPES}
        onCreate={openCreate}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.id}
            {...kpi}
            onClick={() => {
              setStatus(kpi.id === 'all' ? 'all' : kpi.id);
              setPage(1);
            }}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <DevicesTable
          devices={pagedDevices}
          loading={loading}
          selectedId={selectedDevice?.id}
          onSelect={(device) => setSelectedId(device.id)}
          page={currentPage}
          pageSize={PAGE_SIZE}
          totalCount={filteredDevices.length}
          onPageChange={setPage}
        />
        <DeviceInspector
          device={selectedDevice}
          devices={devices}
          alerts={alerts}
          onEdit={() => {
            if (!selectedDevice) return;
            setEditingDevice(selectedDevice);
            setModalOpen(true);
          }}
          onCreateTicket={() => setTicketOpen(true)}
          onReview={() => {
            setStatus('risk');
            setPage(1);
          }}
        />
      </div>

      <DeviceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        device={editingDevice}
        onSubmit={submitDevice}
        loading={mutating}
        serviceRequestOptions={serviceRequestOptions}
      />
      <CreateTicketModal
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        onCreate={createTicket}
        loading={ticketMutating}
        seed={
          selectedDevice
            ? {
                title: `Issue with ${selectedDevice.name}`,
                device_ids: [selectedDevice.id],
                department: selectedDevice.department || '',
              }
            : undefined
        }
      />
    </>
  );
}
