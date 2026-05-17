import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '../ui/Card';

function DonutLegend({ items }) {
  return (
    <ul className="flex flex-1 flex-col gap-3">
      {items.map((item, i) => (
        <motion.li
          key={item.name}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.05 }}
          whileHover={{ x: 4 }}
          className="flex items-center gap-2.5 text-xs"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white/10"
            style={{ backgroundColor: item.color }}
          />
          <span className="flex-1 text-zinc-400">{item.name}</span>
          <span className="font-semibold tabular-nums text-white">{item.value}</span>
          <span className="w-9 text-right tabular-nums text-zinc-500">{item.percent}%</span>
        </motion.li>
      ))}
    </ul>
  );
}

export function DonutChartCard({ title, data, total, totalLabel = 'Total', delay = 0 }) {
  return (
    <Card className="h-full min-h-[360px]" delay={delay}>
      <CardHeader title={title} />
      <CardBody>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="relative h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={76}
                  paddingAngle={4}
                  cornerRadius={4}
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
              <span className="text-3xl font-semibold tracking-tight text-white tabular-nums">
                {total}
              </span>
              <span className="text-label mt-0.5 normal-case">{totalLabel}</span>
            </div>
          </div>
          <DonutLegend items={data} />
        </div>
      </CardBody>
    </Card>
  );
}
