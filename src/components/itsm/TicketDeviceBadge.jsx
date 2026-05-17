import { Link } from 'react-router-dom';
import { Monitor } from 'lucide-react';
import { DeviceStatusBadge } from '../devices/DeviceStatusBadge';

export function TicketDeviceBadge({ device, compact = false }) {
  if (!device) return null;

  return (
    <Link
      to={`/devices/${device.id}`}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white"
    >
      <Monitor size={14} className="text-violet-300" />
      <span className="font-medium">{device.name}</span>
      {!compact && <span className="text-zinc-600">{device.asset_tag}</span>}
      {!compact && <DeviceStatusBadge status={device.health_status} />}
    </Link>
  );
}
