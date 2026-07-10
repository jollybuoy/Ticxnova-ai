import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../ui/Card';

const avatarColors = [
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
];

export function TopUsers({ users = [] }) {
  const navigate = useNavigate();
  return (
    <Card className="h-full" delay={0.25}>
      <CardHeader title="Top Users" subtitle="Most tickets this month" />
      <CardBody className="space-y-4">
        {users.length === 0 && (
          <div className="py-10 text-center text-sm text-zinc-500">No requester activity yet.</div>
        )}
        {users.map((user, i) => (
          <motion.div
            key={user.name}
            initial={false}
            whileHover={{ x: 6 }}
            className="flex items-center gap-4 rounded-xl px-2 py-1"
            onClick={() => navigate(`/tickets?search=${encodeURIComponent(user.name)}`)}
          >
            <motion.div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} text-xs font-semibold text-white shadow-lg ring-2 ring-white/10`}
              whileHover={{ scale: 1.08 }}
            >
              {user.avatar}
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-zinc-500">{user.department}</p>
            </div>
            <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-sm font-semibold tabular-nums text-white ring-1 ring-white/[0.06]">
              {user.tickets}
            </span>
          </motion.div>
        ))}
      </CardBody>
    </Card>
  );
}
