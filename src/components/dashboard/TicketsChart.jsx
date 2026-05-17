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
import { ChartTooltip } from '../ui/ChartTooltip';
import { ticketsTrend } from '../../data/dummyData';

export function TicketsChart() {
  return (
    <Card className="h-full min-h-[360px]" delay={0.1}>
      <CardHeader title="Tickets Overview" subtitle="Volume over the last 30 days" />
      <CardBody className="h-[280px] pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ticketsTrend} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c6cf0" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#7c6cf0" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 50]}
              dx={-4}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: 'rgba(124,108,240,0.35)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="tickets"
              stroke="url(#lineStroke)"
              strokeWidth={2.5}
              fill="url(#ticketGradient)"
              dot={false}
              activeDot={{
                r: 6,
                fill: '#a78bfa',
                stroke: '#0c1019',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
