import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { UserAvatar } from '../ui/UserAvatar';

const loadTone = {
  High: 'text-orange-300',
  Medium: 'text-yellow-300',
  Low: 'text-emerald-300',
};

const barTone = {
  High: 'bg-orange-400',
  Medium: 'bg-yellow-400',
  Low: 'bg-violet-500',
};

export function TopUsers({ users = [] }) {
  return (
    <Card hover={false} className="h-full">
      <CardHeader title="Team workload" subtitle="Open tickets by owner" />
      <CardBody className="space-y-4">
        {users.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">No assigned work yet.</p>
        ) : (
          users.map((user) => (
            <div key={user.name} className="space-y-2">
              <div className="flex items-center gap-3">
                <UserAvatar name={user.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{user.name}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${barTone[user.load]}`} style={{ width: `${user.percent}%` }} />
                  </div>
                </div>
                <span className="text-right">
                  <span className="block text-xs font-semibold tabular-nums text-zinc-300">{user.percent}%</span>
                  <span className={`text-[11px] font-semibold ${loadTone[user.load]}`}>{user.load}</span>
                </span>
              </div>
            </div>
          ))
        )}
        <Link to="/settings/users" className="inline-block text-sm font-medium text-blue-400 hover:text-blue-300">
          View team dashboard →
        </Link>
      </CardBody>
    </Card>
  );
}
