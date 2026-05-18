import { useMemo } from 'react';
import { useDevices } from './useDevices';
import { useTenantDirectory } from './useTenantDirectory';
import { useTickets } from './useTickets';
import { getPriorityLabel, getStatusMeta } from '../lib/tickets/constants';

const colors = ['#8b5cf6', '#22c55e', '#eab308', '#3b82f6', '#ef4444', '#6b7280'];

function percent(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function groupDonut(items, key, fallback = 'Other') {
  const total = items.length;
  const counts = new Map();
  items.forEach((item) => {
    const name = item[key] || fallback;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  return [...counts.entries()].map(([name, value], index) => ({
    name,
    value,
    color: colors[index % colors.length],
    percent: percent(value, total),
  }));
}

function last30DayTrend(tickets) {
  const today = new Date();
  const buckets = Array.from({ length: 8 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (7 - index) * 4);
    return {
      key: date.toISOString().slice(0, 10),
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      tickets: 0,
    };
  });

  tickets.forEach((ticket) => {
    const created = new Date(ticket.created_at);
    const ageDays = Math.floor((today.getTime() - created.getTime()) / 86_400_000);
    if (ageDays < 0 || ageDays > 30) return;
    const bucketIndex = Math.min(7, Math.max(0, Math.floor((30 - ageDays) / 4)));
    buckets[bucketIndex].tickets += 1;
  });

  return buckets;
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function topRequesters(tickets, users) {
  const userMap = new Map(users.map((user) => [user.email, user]));
  const counts = new Map();
  tickets.forEach((ticket) => {
    const key = ticket.requester_email || ticket.requester_name || 'Unassigned';
    const current = counts.get(key) ?? {
      name: ticket.requester_name || userMap.get(ticket.requester_email)?.full_name || key,
      department: ticket.department || userMap.get(ticket.requester_email)?.department || 'Unassigned',
      tickets: 0,
    };
    current.tickets += 1;
    counts.set(key, current);
  });

  return [...counts.values()]
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 5)
    .map((user) => ({ ...user, avatar: initials(user.name) }));
}

function recentTickets(tickets) {
  return tickets.slice(0, 5).map((ticket) => {
    const status = getStatusMeta(ticket.status);
    return {
      id: ticket.ticket_number || ticket.id,
      title: ticket.title,
      user: ticket.requester_name || ticket.requester_email || 'Unassigned',
      status: status.label,
      statusColor: status.badge,
      icon: ticket.category?.includes('Password') ? 'KeyRound' : ticket.category?.includes('Network') ? 'Wifi' : 'Ticket',
    };
  });
}

function buildInsights(tickets, devices, users) {
  const aiAssisted = tickets.filter((ticket) => ticket.ai_summary || ticket.ai_reasoning).length;
  const unhealthyDevices = devices.filter((device) => ['Warning', 'Critical', 'Offline'].includes(device.health_status));
  const inactiveUsers = users.filter((user) => !user.is_active).length;
  const categoryCounts = groupDonut(tickets, 'category');
  const topCategory = categoryCounts.sort((a, b) => b.value - a.value)[0];

  return {
    featured: {
      title: topCategory ? `${topCategory.name} tickets trending` : 'No ticket trend detected yet',
      description: topCategory
        ? `${topCategory.value} ${topCategory.name.toLowerCase()} ticket${topCategory.value === 1 ? '' : 's'} found in your current service desk data.`
        : 'Create tickets and connect devices to unlock operational AI insights.',
      action: 'Open Reports',
    },
    alerts: [
      { text: `${aiAssisted} AI-assisted tickets`, type: 'success', icon: 'Sparkles' },
      { text: `${inactiveUsers} inactive users detected`, type: 'warning', icon: 'AlertCircle' },
      { text: `${unhealthyDevices.length} unhealthy devices need review`, type: 'orange', icon: 'Star' },
    ],
  };
}

function withinRange(date, range) {
  if (!range || range === 'all') return true;
  const days = Number(range);
  if (!Number.isFinite(days)) return true;
  return new Date(date).getTime() >= Date.now() - days * 86_400_000;
}

export function useDashboardData(dateRange = '30') {
  const { tickets, loading: ticketsLoading } = useTickets();
  const { devices, loading: devicesLoading } = useDevices();
  const { users, loading: usersLoading } = useTenantDirectory();

  return useMemo(() => {
    const scopedTickets = tickets.filter((ticket) => withinRange(ticket.created_at, dateRange));
    const scopedDevices = devices.filter((device) => withinRange(device.created_at, dateRange) || dateRange === 'all');
    const openTickets = scopedTickets.filter((ticket) => ['open', 'in_progress', 'pending'].includes(ticket.status));
    const aiResolved = scopedTickets.filter((ticket) => ticket.status === 'resolved' && (ticket.ai_summary || ticket.ai_reasoning));
    const unhealthyDevices = scopedDevices.filter((device) => ['Warning', 'Critical', 'Offline'].includes(device.health_status));
    const urgentOpen = openTickets.filter((ticket) => ['urgent', 'high'].includes(ticket.priority));
    const resolved = scopedTickets.filter((ticket) => ticket.status === 'resolved');
    const slaCompliance = scopedTickets.length ? Math.round((resolved.length / scopedTickets.length) * 100) : 100;

    return {
      loading: ticketsLoading || devicesLoading || usersLoading,
      metrics: [
        {
          id: 'open-tickets',
          href: '/tickets?status=open',
          label: 'Open Tickets',
          value: String(openTickets.length),
          change: `${scopedTickets.length} total tickets`,
          changeColor: 'text-accent-purple',
          icon: 'MessageSquare',
          iconBg: 'bg-purple-500/15',
          iconColor: 'text-accent-purple',
        },
        {
          id: 'ai-resolved',
          href: '/reports/ai-insights',
          label: 'AI Resolved',
          value: String(aiResolved.length),
          change: `${scopedTickets.filter((ticket) => ticket.ai_summary || ticket.ai_reasoning).length} AI-assisted`,
          changeColor: 'text-accent-green',
          icon: 'CheckCircle2',
          iconBg: 'bg-green-500/15',
          iconColor: 'text-accent-green',
        },
        {
          id: 'active-devices',
          href: '/devices',
          label: 'Active Devices',
          value: String(scopedDevices.length),
          change: `${unhealthyDevices.length} unhealthy assets`,
          changeColor: unhealthyDevices.length ? 'text-accent-yellow' : 'text-accent-green',
          icon: 'Monitor',
          iconBg: 'bg-blue-500/15',
          iconColor: 'text-accent-blue',
        },
        {
          id: 'sla-compliance',
          href: '/reports/sla',
          label: 'Resolution Rate',
          value: `${slaCompliance}%`,
          change: `${resolved.length} resolved tickets`,
          changeColor: 'text-accent-yellow',
          icon: 'Shield',
          iconBg: 'bg-yellow-500/15',
          iconColor: 'text-accent-yellow',
        },
        {
          id: 'priority-alerts',
          href: '/tickets?priority=urgent',
          label: 'Priority Alerts',
          value: String(urgentOpen.length),
          change: urgentOpen[0] ? `${getPriorityLabel(urgentOpen[0].priority)} needs attention` : 'No P1/P2 open tickets',
          changeColor: urgentOpen.length ? 'text-accent-red' : 'text-accent-green',
          icon: 'AlertTriangle',
          iconBg: 'bg-red-500/15',
          iconColor: 'text-accent-red',
        },
      ],
      ticketsTrend: last30DayTrend(scopedTickets),
      ticketsByCategory: groupDonut(scopedTickets, 'category'),
      devicesStatus: groupDonut(scopedDevices, 'health_status', 'Unknown'),
      recentTickets: recentTickets(scopedTickets),
      topUsers: topRequesters(scopedTickets, users),
      aiInsights: buildInsights(scopedTickets, scopedDevices, users),
      automation: {
        activeWorkflows: scopedTickets.filter((ticket) => ticket.ticket_type === 'service_request').length,
        executedToday: scopedTickets.filter((ticket) => {
          const created = new Date(ticket.created_at).toDateString();
          return created === new Date().toDateString();
        }).length,
        successRate: `${slaCompliance}%`,
        nextWorkflow: {
          name: openTickets[0]?.ticket_number || 'No queued workflow',
          time: openTickets[0] ? openTickets[0].title : 'all clear',
        },
      },
    };
  }, [dateRange, devices, devicesLoading, tickets, ticketsLoading, users, usersLoading]);
}
