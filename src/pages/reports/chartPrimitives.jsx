import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltip } from '../../components/ui/ChartTooltip';

const axis = { fill: '#71717a', fontSize: 11 };
const grid = 'rgba(255,255,255,0.06)';

export function AreaReportChart({ data, dataKey = 'tickets', color = '#8b5cf6' }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip valueLabel={dataKey} />} />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.16} strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarReportChart({ data, dataKey = 'value', color = '#8b5cf6' }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip valueLabel={dataKey} />} />
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineReportChart({ data, dataKey = 'compliance', color = '#34d399' }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip valueLabel={dataKey} />} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DonutReportChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={3}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip valueLabel="items" />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HeatmapGrid({ rows }) {
  const max = Math.max(1, ...rows.flatMap((row) => row.values.map((value) => value.value)));
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.name} className="grid grid-cols-[120px_repeat(5,1fr)] items-center gap-2">
          <span className="truncate text-xs text-zinc-500">{row.name}</span>
          {row.values.map((cell) => (
            <div
              key={`${row.name}-${cell.day}`}
              className="rounded-lg border border-white/[0.06] px-2 py-3 text-center text-xs text-white"
              style={{ backgroundColor: `rgba(139, 92, 246, ${0.12 + (cell.value / max) * 0.55})` }}
            >
              {cell.value}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
