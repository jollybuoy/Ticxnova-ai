import { Link } from 'react-router-dom';
import { ArrowUpRight, Edit3, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { DeviceStatusBadge } from './DeviceStatusBadge';
import { formatDeviceDate, isWarrantyExpiring } from '../../lib/devices/constants';

export function DevicesTable({ devices, onEdit, onDelete }) {
  if (devices.length === 0) {
    return (
      <div className="glass-card px-6 py-12 text-center">
        <p className="text-sm font-medium text-white">No devices found</p>
        <p className="mt-1 text-sm text-zinc-500">Add devices or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-white/[0.06] text-xs uppercase tracking-[0.18em] text-zinc-500">
            <tr>
              <th className="px-5 py-4 font-medium">Device</th>
              <th className="px-5 py-4 font-medium">Assigned user</th>
              <th className="px-5 py-4 font-medium">Department</th>
              <th className="px-5 py-4 font-medium">Serial</th>
              <th className="px-5 py-4 font-medium">Warranty</th>
              <th className="px-5 py-4 font-medium">Health</th>
              <th className="px-5 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {devices.map((device) => (
              <tr key={device.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="px-5 py-4">
                  <div>
                    <Link to={`/devices/${device.id}`} className="font-semibold text-white hover:text-violet-300">
                      {device.name}
                    </Link>
                    <p className="mt-1 text-xs text-zinc-500">
                      {device.asset_tag} · {device.device_type}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4 text-zinc-300">{device.assigned_user || 'Unassigned'}</td>
                <td className="px-5 py-4 text-zinc-400">{device.department || '—'}</td>
                <td className="px-5 py-4 font-mono text-xs text-zinc-400">{device.serial_number || '—'}</td>
                <td className="px-5 py-4">
                  <span className={isWarrantyExpiring(device) ? 'text-amber-300' : 'text-zinc-400'}>
                    {formatDeviceDate(device.warranty_expiry)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <DeviceStatusBadge status={device.health_status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" className="px-3" onClick={() => onEdit(device)}>
                      <Edit3 size={15} />
                    </Button>
                    <Link
                      to={`/devices/${device.id}`}
                      className="focus-ring inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <ArrowUpRight size={15} />
                    </Link>
                    <Button variant="ghost" className="px-3 text-red-300 hover:text-red-200" onClick={() => onDelete(device)}>
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-white/[0.06] lg:hidden">
        {devices.map((device) => (
          <div key={device.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link to={`/devices/${device.id}`} className="font-semibold text-white">
                  {device.name}
                </Link>
                <p className="mt-1 text-xs text-zinc-500">{device.asset_tag} · {device.device_type}</p>
              </div>
              <DeviceStatusBadge status={device.health_status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-400">
              <span>Owner: {device.assigned_user || 'Unassigned'}</span>
              <span>Dept: {device.department || '—'}</span>
              <span>Serial: {device.serial_number || '—'}</span>
              <span>Warranty: {formatDeviceDate(device.warranty_expiry)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
