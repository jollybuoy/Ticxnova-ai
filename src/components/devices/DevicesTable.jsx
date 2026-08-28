import { CheckCircle2, ChevronLeft, ChevronRight, Laptop, ShieldAlert } from 'lucide-react';
import { Card } from '../ui/Card';
import { UserAvatar } from '../ui/UserAvatar';
import { RingGauge } from '../ui/RingGauge';
import { Spinner } from '../ui/Spinner';
import {
  healthScore,
  healthTone,
  isCompliant,
  lastSeen,
  osLabel,
} from '../../lib/devices/fleetMetrics';

export function DevicesTable({
  devices,
  loading,
  selectedId,
  onSelect,
  page,
  pageSize,
  totalCount,
  onPageChange,
}) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  if (loading) {
    return (
      <Card hover={false} className="flex min-h-[420px] items-center justify-center">
        <Spinner className="h-8 w-8 text-violet-400" />
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Card hover={false} className="px-6 py-16 text-center">
        <p className="text-sm font-medium text-white">No devices in this view</p>
        <p className="mt-1 text-sm text-zinc-500">Enroll a device or change filters.</p>
      </Card>
    );
  }

  return (
    <Card hover={false} className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-white/15 text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">OS</th>
              <th className="px-4 py-3">Compliance</th>
              <th className="px-4 py-3">Last check-in</th>
              <th className="px-4 py-3">Health</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => {
              const score = healthScore(device);
              const tone = healthTone(score);
              const selected = selectedId === device.id;
              return (
                <tr
                  key={device.id}
                  className={`cursor-pointer border-b border-white/10 last:border-0 ${selected ? 'bg-violet-500/10' : 'hover:bg-white/[0.03]'}`}
                  onClick={() => onSelect(device)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5">
                        <Laptop size={16} className="text-violet-300" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{device.name}</p>
                        <p className="text-xs text-zinc-500">
                          {device.asset_tag} · {device.device_type}
                        </p>
                      </div>
                    </div>
                  </td>
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
                  <td className="px-4 py-3 text-sm text-zinc-300">{osLabel(device)}</td>
                  <td className="px-4 py-3">
                    {isCompliant(device) ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300">
                        <CheckCircle2 size={14} />
                        Compliant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-amber-300">
                        <ShieldAlert size={14} />
                        Needs review
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{lastSeen(device)}</td>
                  <td className="px-4 py-3">
                    <RingGauge value={score} color={tone.color} size={44} stroke={5} display={score} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-white/15 px-4 py-3 text-xs text-zinc-500">
        <span>
          {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-white/15 p-1.5 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-violet-600 px-2 font-semibold text-white">{page}</span>
          <button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-white/15 p-1.5 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
