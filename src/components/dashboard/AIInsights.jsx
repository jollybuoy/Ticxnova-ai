import { ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';

const tones = {
  red: 'bg-red-500',
  orange: 'bg-orange-400',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
};

export function AIInsights({ insights = [] }) {
  const navigate = useNavigate();
  return (
    <Card hover={false} className="h-full min-h-[360px]">
      <CardHeader title="AI operations brief" subtitle="What to act on next" />
      <CardBody className="flex h-full flex-col gap-2 pt-2">
        {insights.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.href)}
            className="flex w-full items-start gap-3 rounded-xl border border-white/10 px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"
          >
            <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${tones[item.tone]}`} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-white">{item.title}</span>
              <span className="mt-1 block text-xs text-zinc-500">{item.body}</span>
            </span>
            <ChevronRight size={16} className="mt-1 text-zinc-500" />
          </button>
        ))}
        <Button className="mt-auto w-full" onClick={() => navigate('/tickets?quick=sla')}>
          <Sparkles size={16} />
          Review recommendations
        </Button>
      </CardBody>
    </Card>
  );
}
