import { Card, CardBody, CardHeader } from '../ui/Card';

export function AnalyticsCard({ title, subtitle, items = [], empty = 'No data available.' }) {
  return (
    <Card hover={false}>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-500">
              {empty}
            </p>
          ) : (
            items.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  {item.detail && <p className="mt-1 text-xs text-zinc-500">{item.detail}</p>}
                </div>
                <span className="text-lg font-semibold tabular-nums text-violet-200">
                  {item.value ?? item.score ?? item.compliance ?? item.incidents}
                </span>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
