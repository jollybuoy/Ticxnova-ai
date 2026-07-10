import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/IconMap';

export function RecentTickets({ tickets = [] }) {
  const navigate = useNavigate();
  return (
    <Card className="h-full" delay={0.2}>
      <CardHeader title="Recent Tickets" subtitle="Latest activity across your org" />
      <CardBody className="space-y-0 p-0">
        {tickets.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-zinc-500">No recent tickets yet.</div>
        )}
        {tickets.map((ticket, i) => (
          <motion.div
            key={ticket.id}
            initial={false}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            className="flex items-center gap-4 border-b border-white/[0.04] px-6 py-4 last:border-0"
            onClick={() => navigate(`/tickets?search=${encodeURIComponent(ticket.id)}`)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06]">
              <Icon name={ticket.icon} size={18} className="text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{ticket.title}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
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
