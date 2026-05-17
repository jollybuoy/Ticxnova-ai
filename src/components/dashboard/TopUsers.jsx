import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { topUsers } from '../../data/dummyData';

const avatarColors = [
  'from-purple-500 to-violet-600',
  'from-blue-500 to-cyan-600',
  'from-green-500 to-emerald-600',
  'from-yellow-500 to-orange-600',
  'from-pink-500 to-rose-600',
];

export function TopUsers() {
  return (
    <Card className="h-full">
      <CardHeader title="Top 5 Users with Most Tickets" />
      <CardBody className="space-y-3">
        {topUsers.map((user, i) => (
          <motion.div
            key={user.name}
            whileHover={{ x: 4 }}
            className="flex items-center gap-3"
          >
            <motion.div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColors[i]} text-xs font-bold text-white`}
              whileHover={{ scale: 1.08 }}
            >
              {user.avatar}
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-500">{user.department}</p>
            </div>
            <span className="text-sm font-bold text-white">{user.tickets}</span>
          </motion.div>
        ))}
      </CardBody>
    </Card>
  );
}
