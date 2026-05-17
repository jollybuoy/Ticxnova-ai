import { Link } from 'react-router-dom';
import { CalendarClock, Cpu, MapPin, Trash2, UserRound } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { DeviceStatusBadge } from './DeviceStatusBadge';
import { formatDeviceDate, isWarrantyExpiring } from '../../lib/devices/constants';

export function DevicesGrid({ devices, onEdit, onDelete }) {
  if (devices.length === 0) {
    return (
      <div className="glass-card px-6 py-12 text-center">
        <p className="text-sm font-medium text-white">No devices found</p>
        <p className="mt-1 text-sm text-zinc-500">Add devices or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {devices.map((device, index) => (
        <Card key={device.id} delay={index * 0.03}>
          <CardBody className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-violet-300">
                  {device.asset_tag}
                </p>
                <Link to={`/devices/${device.id}`} className="mt-2 block text-lg font-semibold text-white hover:text-violet-300">
                  {device.name}
                </Link>
                <p className="mt-1 text-sm text-zinc-500">{device.device_type}</p>
              </div>
              <DeviceStatusBadge status={device.health_status} />
            </div>

            <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <UserRound size={15} className="text-zinc-500" />
                {device.assigned_user || 'Unassigned'}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-zinc-500" />
                {device.department || 'No department'} · {device.location || 'No location'}
              </div>
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-zinc-500" />
                {device.manufacturer || 'Unknown'} {device.model || ''}
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock size={15} className={isWarrantyExpiring(device) ? 'text-amber-300' : 'text-zinc-500'} />
                Warranty {formatDeviceDate(device.warranty_expiry)}
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/devices/${device.id}`}
                className="focus-ring inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.08]"
              >
                View details
              </Link>
              <Button variant="secondary" onClick={() => onEdit(device)}>
                Edit
              </Button>
              <Button variant="ghost" className="px-3 text-red-300 hover:text-red-200" onClick={() => onDelete(device)}>
                <Trash2 size={15} />
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
