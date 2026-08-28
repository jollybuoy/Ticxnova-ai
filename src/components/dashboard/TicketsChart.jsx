import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { ChartTooltip } from '../ui/ChartTooltip';

export function TicketsChart({ data = [] }) {
  return (
    <Card hover={false} className="h-full min-h-[360px]">
      <CardHeader
        title="Ticket overview"
        subtitle="Volume by day and priority"
        action={<span className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-zinc-400">By day</span>}
      />
      <CardBody className="h-[280px] pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip valueLabel="tickets" />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="critical" stackId="p" fill="#ef4444" radius={[0, 0, 0, 0]} />
            <Bar dataKey="high" stackId="p" fill="#fb923c" />
            <Bar dataKey="normal" stackId="p" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
