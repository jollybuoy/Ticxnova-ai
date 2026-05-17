import { Link } from 'react-router-dom';
import { ArrowUpRight, Monitor, Trash2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { DeviceSelector } from './DeviceSelector';
import { DeviceStatusBadge } from '../devices/DeviceStatusBadge';

export function LinkedDevicesPanel({ devices, selectedIds, onSelectionChange, onRemove, mutating }) {
  return (
    <Card hover={false}>
      <CardHeader
        title="Affected Assets"
        subtitle="Devices linked to this ticket and incident context"
      />
      <CardBody className="space-y-5">
        {devices.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-500">
            No devices linked yet.
          </p>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div key={device.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200">
                      <Monitor size={18} />
                    </div>
                    <div>
                      <Link to={`/devices/${device.id}`} className="font-semibold text-white hover:text-violet-300">
                        {device.name}
                      </Link>
                      <p className="mt-1 text-xs text-zinc-500">
                        {device.asset_tag} · {device.device_type} · {device.department || 'No department'}
                      </p>
                    </div>
                  </div>
                  <DeviceStatusBadge status={device.health_status} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/devices/${device.id}`}
                    className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/[0.08]"
                  >
                    View asset <ArrowUpRight size={14} />
                  </Link>
                  <Button variant="ghost" className="px-3 text-red-300 hover:text-red-200" disabled={mutating} onClick={() => onRemove(device.id)}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DeviceSelector selectedIds={selectedIds} onChange={onSelectionChange} disabled={mutating} />
      </CardBody>
    </Card>
  );
}
