import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Card, CardBody, CardHeader } from '../ui/Card';

function DonutLegend({ items }) {
  return (
    <ul className="flex flex-1 flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.name} className="flex items-center gap-2 text-xs">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="flex-1 text-gray-400">{item.name}</span>
          <span className="font-medium text-white">{item.value}</span>
          <span className="w-8 text-right text-gray-500">{item.percent}%</span>
        </li>
      ))}
    </ul>
  );
}

export function DonutChartCard({ title, data, total, totalLabel = 'Total' }) {
  return (
    <Card className="h-full min-h-[320px]">
      <CardHeader title={title} />
      <CardBody>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative h-44 w-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{total}</span>
              <span className="text-[10px] text-gray-500">{totalLabel}</span>
            </div>
          </div>
          <DonutLegend items={data} />
        </div>
      </CardBody>
    </Card>
  );
}
