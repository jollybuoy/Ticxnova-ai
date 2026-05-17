import { BrainCircuit, CircleDollarSign, Repeat2, ShieldAlert } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { buildAssetHealthInsight } from '../../lib/itsm/ticketDeviceService';

export function AssetHealthCard({ device, tickets }) {
  const insight = buildAssetHealthInsight(device, tickets);
  const openCount = tickets.filter((ticket) => ['open', 'in_progress', 'pending'].includes(ticket.status)).length;
  const recurringCount = tickets.length;
  const toneClass = {
    green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    yellow: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    red: 'border-red-500/20 bg-red-500/10 text-red-200',
  }[insight.tone];

  return (
    <Card hover={false}>
      <CardHeader title="AI Asset Health Intelligence" subtitle="Recurring incident and replacement signals" />
      <CardBody className="space-y-4">
        <div className={`rounded-2xl border p-4 ${toneClass}`}>
          <div className="flex items-center gap-2 font-semibold">
            <BrainCircuit size={18} />
            {insight.title}
          </div>
          <p className="mt-2 text-sm leading-relaxed opacity-90">{insight.summary}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <Repeat2 size={17} className="text-violet-300" />
            <p className="mt-3 text-2xl font-semibold text-white">{recurringCount}</p>
            <p className="text-xs text-zinc-500">Historical tickets</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <ShieldAlert size={17} className="text-amber-300" />
            <p className="mt-3 text-2xl font-semibold text-white">{openCount}</p>
            <p className="text-xs text-zinc-500">Open issues</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <CircleDollarSign size={17} className="text-cyan-300" />
            <p className="mt-3 text-2xl font-semibold text-white">{recurringCount * 125}</p>
            <p className="text-xs text-zinc-500">Est. support cost</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
