import { useMemo } from 'react';
import { Monitor, Search } from 'lucide-react';
import { useDevices } from '../../hooks/useDevices';
import { DeviceStatusBadge } from '../devices/DeviceStatusBadge';

export function suggestTicketCategory(device) {
  if (!device) return null;
  if (device.device_type === 'Network Device') return 'Network Issue';
  if (['Laptop', 'Desktop', 'Server', 'Mobile Device'].includes(device.device_type)) return 'Hardware Issue';
  return 'Other';
}

export function DeviceSelector({ selectedIds = [], onChange, onPrimaryDeviceChange, disabled = false }) {
  const { devices, loading } = useDevices();

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleDevice = (device) => {
    const next = selected.has(device.id)
      ? selectedIds.filter((id) => id !== device.id)
      : [...selectedIds, device.id];
    onChange(next);
    if (!selected.has(device.id) && onPrimaryDeviceChange) {
      onPrimaryDeviceChange(device);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-xs font-medium text-zinc-400">Affected devices</label>
        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
          <Search size={12} />
          {selectedIds.length} selected
        </span>
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2">
        {loading ? (
          <p className="px-3 py-4 text-sm text-zinc-500">Loading devices...</p>
        ) : devices.length === 0 ? (
          <p className="px-3 py-4 text-sm text-zinc-500">No devices available. Add devices from the inventory first.</p>
        ) : (
          devices.map((device) => {
            const active = selected.has(device.id);
            return (
              <button
                key={device.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleDevice(device)}
                className={`focus-ring flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                  active
                    ? 'border-violet-400/40 bg-violet-500/15'
                    : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-violet-200">
                  <Monitor size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{device.name}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {device.asset_tag} · {device.device_type} · {device.department || 'No department'}
                  </p>
                </div>
                <DeviceStatusBadge status={device.health_status} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
