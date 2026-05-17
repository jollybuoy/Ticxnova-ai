import { BrainCircuit, MonitorX, ShieldCheck, TicketCheck } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../ui/Card';

export function ExecutiveSummary({ analytics }) {
  const items = [
    {
      icon: ShieldCheck,
      label: 'SLA posture',
      value: `${analytics.executive.slaCompliance}% compliance`,
      detail: 'Compliance calculated from open aging and priority windows.',
    },
    {
      icon: TicketCheck,
      label: 'Resolution velocity',
      value: analytics.executive.mttr,
      detail: 'Estimated MTTR from resolved ticket lifecycle.',
    },
    {
      icon: BrainCircuit,
      label: 'AI impact',
      value: `${analytics.executive.aiAssisted} assisted tickets`,
      detail: 'Tickets with AI summaries or recommendations.',
    },
    {
      icon: MonitorX,
      label: 'Asset risk',
      value: `${analytics.executive.criticalDevices} critical devices`,
      detail: 'Critical or offline devices in current inventory.',
    },
  ];

  return (
    <Card hover={false}>
      <CardHeader title="Executive Summary" subtitle="Operational posture across tickets, assets, AI and SLA" />
      <CardBody>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
              <item.icon size={20} className="text-violet-300" />
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
