import { CheckCircle2, MessageSquare, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { UserAvatar } from '../ui/UserAvatar';

function iconFor(status) {
  if (status === 'resolved') return CheckCircle2;
  if (status === 'pending') return MessageSquare;
  return UserRound;
}

export function AutomationOverview({ activity = [] }) {
  const navigate = useNavigate();
  return (
    <Card hover={false} className="h-full">
      <CardHeader title="Recent activity" subtitle="Latest ticket movement" />
      <CardBody className="space-y-4">
        {activity.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">No recent activity yet.</p>
        ) : (
          activity.map((item) => {
            const Icon = iconFor(item.status);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/tickets/${item.id}`)}
                className="flex w-full items-start gap-3 text-left"
              >
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-300">
                  <Icon size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white">
                    {item.number} {item.status === 'resolved' ? 'resolved' : 'updated'}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-500">{item.title}</span>
                </span>
                <span className="flex items-center gap-2 text-xs text-zinc-500">
                  {item.age}
                  <UserAvatar name={item.actor} />
                </span>
              </button>
            );
          })
        )}
        <Link to="/tickets" className="inline-block text-sm font-medium text-blue-400 hover:text-blue-300">
          View all activity →
        </Link>
      </CardBody>
    </Card>
  );
}
