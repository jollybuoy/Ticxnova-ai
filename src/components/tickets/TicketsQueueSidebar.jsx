import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sparkline } from '../ui/Sparkline';

export function TicketsQueueSidebar({ open, unassigned, slaRisk, onRefresh }) {
  const navigate = useNavigate();
  return (
    <aside className="space-y-4">
      <Card hover={false} className="p-0">
        <CardHeader title="Queue health" />
        <CardBody className="space-y-4">
          {[
            { label: 'Open', value: open, color: '#f87171' },
            { label: 'Unassigned', value: unassigned, color: '#fb923c' },
            { label: 'SLA risk', value: slaRisk, color: '#ef4444' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{item.value}</p>
              </div>
              <Sparkline values={[Math.max(1, item.value - 2), item.value, Math.max(0, item.value - 1), item.value + 1, item.value]} color={item.color} />
            </div>
          ))}
        </CardBody>
      </Card>

      <Card hover={false} className="border-violet-400/25 p-0">
        <CardBody className="space-y-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={16} className="text-violet-300" />
            AI suggestion
          </p>
          <p className="text-sm leading-relaxed text-zinc-300">
            {slaRisk > 0
              ? `${slaRisk} ticket${slaRisk === 1 ? '' : 's'} ${slaRisk === 1 ? 'is' : 'are'} at risk of breaching SLA.`
              : 'No SLA-risk tickets right now. Keep assigning new work as it arrives.'}
          </p>
          <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-400">
            {unassigned > 0 && <li>Assign unassigned tickets first</li>}
            {slaRisk > 0 && <li>Escalate or start work on SLA-risk items</li>}
            <li>Use Copilot on a ticket to draft the next update</li>
          </ul>
          <Button className="w-full" onClick={() => navigate('/tickets?quick=sla')}>
            View suggested tickets
          </Button>
        </CardBody>
      </Card>

      <button type="button" onClick={onRefresh} className="w-full text-left text-xs text-zinc-500 hover:text-zinc-300">
        Last updated just now · Refresh
      </button>
    </aside>
  );
}
