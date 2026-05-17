import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Cpu, MapPin, PenLine, UserRound } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { DeviceFormModal } from '../components/devices/DeviceFormModal';
import { DeviceStatusBadge } from '../components/devices/DeviceStatusBadge';
import { AssetHealthCard } from '../components/itsm/AssetHealthCard';
import { DeviceIncidentTimeline } from '../components/itsm/DeviceIncidentTimeline';
import { RelatedTicketsCard } from '../components/itsm/RelatedTicketsCard';
import { ServiceRequestAttachPanel } from '../components/itsm/ServiceRequestAttachPanel';
import { useDeviceDetails } from '../hooks/useDeviceDetails';
import { DEVICE_STATUSES, formatDeviceDate } from '../lib/devices/constants';

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-3 text-sm font-medium text-white">{value || '—'}</p>
    </div>
  );
}

export default function DeviceDetails() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const {
    device,
    notes,
    activity,
    relatedTickets,
    loading,
    mutating,
    updateFields,
    addNote,
    attachServiceRequest,
  } = useDeviceDetails(deviceId);
  const [note, setNote] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const submitNote = async (event) => {
    event.preventDefault();
    const result = await addNote(note);
    if (result.success) setNote('');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="glass-card px-6 py-12 text-center text-sm text-zinc-500">Loading device details...</div>
      </DashboardLayout>
    );
  }

  if (!device) {
    return (
      <DashboardLayout>
        <div className="glass-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-white">Device not found</p>
          <Button className="mt-4" onClick={() => navigate('/devices')}>
            Back to inventory
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const openIssueCount = relatedTickets.filter((ticket) =>
    ['open', 'in_progress', 'pending'].includes(ticket.status),
  ).length;
  const hasLinkedServiceRequest = relatedTickets.some(
    (ticket) => ticket.ticket_type === 'service_request',
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/devices" className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white">
            <ArrowLeft size={16} />
            Back to inventory
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white">{device.name}</h1>
            <DeviceStatusBadge status={device.health_status} />
          </div>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-violet-300">
            {device.asset_tag} · {device.device_type}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={device.health_status}
            onChange={(event) => updateFields({ health_status: event.target.value })}
            options={DEVICE_STATUSES}
            disabled={mutating}
          />
          <Button onClick={() => setEditOpen(true)}>
            <PenLine size={16} />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DetailItem icon={UserRound} label="Assigned user" value={device.assigned_user || 'Unassigned'} />
        <DetailItem icon={MapPin} label="Department / Location" value={`${device.department || 'No department'} · ${device.location || 'No location'}`} />
        <DetailItem icon={Cpu} label="Hardware" value={`${device.manufacturer || 'Unknown'} ${device.model || ''}`} />
        <DetailItem icon={CalendarClock} label="Warranty expiry" value={formatDeviceDate(device.warranty_expiry)} />
        <DetailItem icon={CalendarClock} label="Open issues" value={`${openIssueCount}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader title="Device Profile" subtitle="Lifecycle, ownership and technical identifiers" />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem icon={Cpu} label="Serial number" value={device.serial_number} />
              <DetailItem icon={CalendarClock} label="Purchase date" value={formatDeviceDate(device.purchase_date)} />
              <DetailItem icon={UserRound} label="Assigned user" value={device.assigned_user} />
              <DetailItem icon={MapPin} label="Location" value={device.location} />
            </div>
            {device.notes && (
              <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Device notes</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{device.notes}</p>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          {!hasLinkedServiceRequest && (
            <ServiceRequestAttachPanel
              relatedTickets={relatedTickets}
              onAttach={attachServiceRequest}
              loading={mutating}
            />
          )}
          <RelatedTicketsCard tickets={relatedTickets} />
        </div>
      </div>

      <AssetHealthCard device={device} tickets={relatedTickets} />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader title="Incident Timeline" subtitle="Recent ticket history for this device" />
          <CardBody>
            <DeviceIncidentTimeline tickets={relatedTickets} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Device Notes" subtitle="Technician work notes and handoff context" />
          <CardBody>
            <form onSubmit={submitNote} className="space-y-3">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a note about repairs, ownership changes or observations..."
                disabled={mutating}
              />
              <Button type="submit" loading={mutating} disabled={!note.trim()}>
                Add note
              </Button>
            </form>
            <div className="mt-5 space-y-3">
              {notes.length === 0 ? (
                <p className="text-sm text-zinc-500">No notes yet.</p>
              ) : (
                notes.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{item.body}</p>
                    <p className="mt-3 text-xs text-zinc-600">
                      {item.author_name || 'Technician'} · {formatDeviceDate(item.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Activity Timeline" subtitle="Realtime asset lifecycle and technician actions" />
        <CardBody>
          <div className="space-y-4">
            {activity.length === 0 ? (
              <p className="text-sm text-zinc-500">No activity yet.</p>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="relative pl-7">
                  <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-violet-400 ring-4 ring-violet-400/10" />
                  <p className="text-sm font-medium text-white">{item.message}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.actor_name || 'System'} · {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      <DeviceFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        device={device}
        onSubmit={(payload) =>
          updateFields({
            asset_tag: payload.asset_tag,
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
          })
        }
        loading={mutating}
      />
    </DashboardLayout>
  );
}
