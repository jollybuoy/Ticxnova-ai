import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/IconMap';
import { recentTickets } from '../../data/dummyData';

export function RecentTickets() {
  return (
    <Card className="h-full">
      <CardHeader title="Recent Tickets" />
      <CardBody className="space-y-1 p-0">
        {recentTickets.map((ticket, i) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            className="flex items-center gap-3 border-b border-white/5 px-5 py-3.5 last:border-0"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
              <Icon name={ticket.icon} size={16} className="text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{ticket.title}</p>
              <p className="text-xs text-gray-500">
                #{ticket.id} · {ticket.user}
              </p>
            </div>
            <Badge variant={ticket.statusColor}>{ticket.status}</Badge>
          </motion.div>
        ))}
      </CardBody>
    </Card>
  );
}
