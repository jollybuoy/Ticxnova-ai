import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { ticketsTrend } from '../../data/dummyData';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-surface-card px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-white">{payload[0].value} tickets</p>
    </div>
  );
}

export function TicketsChart() {
  return (
    <Card className="h-full min-h-[320px]">
      <CardHeader title="Tickets Overview" />
      <CardBody className="h-[260px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ticketsTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 50]}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="tickets"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#ticketGradient)"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#0b0e14' }}
              activeDot={{ r: 6, fill: '#a78bfa' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
