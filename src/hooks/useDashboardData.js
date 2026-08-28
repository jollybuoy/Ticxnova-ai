import { useMemo } from 'react';
import { useDevices } from './useDevices';
import { useTenantDirectory } from './useTenantDirectory';
import { useTickets } from './useTickets';
import { formatAge, getTicketSla } from '../lib/tickets/incidentModel';
import {
  firstName,
  getOpenTickets,
  getResolvedToday,
  getSlaRiskTickets,
  getUnassignedTickets,
  greetingForHour,
  sparklineCounts,
  teamWorkload,
  weekPriorityBars,
} from '../lib/tickets/queueMetrics';
import { useAuth } from './useAuth';
import { getUserDisplayName } from '../lib/user';

function withinRange(date, range) {
  if (!range || range === 'all') return true;
  const days = Number(range);
  if (!Number.isFinite(days)) return true;
  return new Date(date).getTime() >= Date.now() - days * 86_400_000;
}

function deltaLabel(current, previous, { invert = false } = {}) {
  const diff = current - previous;
  if (diff === 0) return { text: 'No change vs prior window', good: null };
  const improved = invert ? diff > 0 : diff < 0;
  return {
    text: `${diff > 0 ? '↑' : '↓'} ${Math.abs(diff)} vs last period`,
    good: improved,
  };
}

export function useDashboardData(dateRange = '7') {
  const { tickets, loading: ticketsLoading } = useTickets();
  const { devices, loading: devicesLoading } = useDevices();
  const { users, loading: usersLoading } = useTenantDirectory();
  const { user } = useAuth();

  return useMemo(() => {
    const scopedTickets = tickets.filter((ticket) => withinRange(ticket.created_at, dateRange));
    const previousRange = dateRange === 'all' ? 'all' : String(Number(dateRange) * 2);
    const previousTickets =
      dateRange === 'all'
        ? []
        : tickets.filter((ticket) => {
            const created = new Date(ticket.created_at).getTime();
            const now = Date.now();
            const current = Number(dateRange) * 86_400_000;
            return created < now - current && created >= now - Number(previousRange) * 86_400_000;
          });

    const openTickets = getOpenTickets(scopedTickets);
    const slaRisk = getSlaRiskTickets(openTickets);
    const unassigned = getUnassignedTickets(openTickets);
    const resolvedToday = getResolvedToday(scopedTickets);
    const prevOpen = getOpenTickets(previousTickets).length;
    const prevSla = getSlaRiskTickets(previousTickets).length;
    const prevUnassigned = getUnassignedTickets(previousTickets).length;
    const prevResolved = getResolvedToday(previousTickets).length;

    const name = firstName(getUserDisplayName(user));

    return {
      loading: ticketsLoading || devicesLoading || usersLoading,
      greeting: `${greetingForHour()}, ${name}`,
      metrics: [
        {
          id: 'open',
          href: '/tickets?status=queue',
          label: 'Open tickets',
          value: String(openTickets.length),
          trend: deltaLabel(openTickets.length, prevOpen),
          spark: sparklineCounts(scopedTickets, 7, (ticket) => ['open', 'in_progress', 'pending'].includes(ticket.status)),
          color: '#8b5cf6',
          icon: 'Ticket',
          iconBg: 'bg-violet-500/15',
          iconColor: 'text-violet-300',
        },
        {
          id: 'sla',
          href: '/tickets?quick=sla',
          label: 'SLA at risk',
          value: String(slaRisk.length),
          trend: deltaLabel(slaRisk.length, prevSla),
          spark: sparklineCounts(slaRisk, 7),
          color: '#fb923c',
          icon: 'AlertTriangle',
          iconBg: 'bg-orange-500/15',
          iconColor: 'text-orange-300',
        },
        {
          id: 'unassigned',
          href: '/tickets?quick=unassigned',
          label: 'Unassigned',
          value: String(unassigned.length),
          trend: deltaLabel(unassigned.length, prevUnassigned),
          spark: sparklineCounts(unassigned, 7),
          color: '#60a5fa',
          icon: 'Users',
          iconBg: 'bg-blue-500/15',
          iconColor: 'text-blue-300',
        },
        {
          id: 'resolved',
          href: '/tickets?status=resolved',
          label: 'Resolved today',
          value: String(resolvedToday.length),
          trend: deltaLabel(resolvedToday.length, prevResolved, { invert: true }),
          spark: sparklineCounts(resolvedToday, 7),
          color: '#34d399',
          icon: 'CheckCircle2',
          iconBg: 'bg-emerald-500/15',
          iconColor: 'text-emerald-300',
        },
      ],
      weekBars: weekPriorityBars(scopedTickets),
      priorityQueue: [...openTickets]
        .sort((a, b) => getTicketSla(a).remainingMs - getTicketSla(b).remainingMs)
        .slice(0, 6),
      team: teamWorkload(scopedTickets),
      activity: [...scopedTickets]
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 6)
        .map((ticket) => ({
          id: ticket.id,
          number: ticket.ticket_number,
          title: ticket.title,
          status: ticket.status,
          actor: ticket.assignee_name || ticket.requester_name || 'System',
          age: formatAge(ticket.updated_at || ticket.created_at),
        })),
      brief: [
        slaRisk.length
          ? {
              id: 'sla',
              tone: 'red',
              title: `${slaRisk.length} ticket${slaRisk.length === 1 ? '' : 's'} approaching SLA`,
              body: 'Escalate or reassign before the window closes.',
              href: '/tickets?quick=sla',
            }
          : {
              id: 'sla',
              tone: 'green',
              title: 'SLA windows are healthy',
              body: 'No open tickets are currently at risk.',
              href: '/reports/sla',
            },
        unassigned.length
          ? {
              id: 'assign',
              tone: 'orange',
              title: `${unassigned.length} unassigned tickets in queue`,
              body: 'Give these an owner so work can start.',
              href: '/tickets?quick=unassigned',
            }
          : {
              id: 'assign',
              tone: 'blue',
              title: 'Queue ownership looks complete',
              body: 'Every open ticket currently has an assignee.',
              href: '/tickets',
            },
        devices.filter((device) => ['Critical', 'Offline'].includes(device.health_status)).length
          ? {
              id: 'assets',
              tone: 'orange',
              title: 'Unhealthy assets need review',
              body: `${devices.filter((device) => ['Critical', 'Offline'].includes(device.health_status)).length} devices are critical or offline.`,
              href: '/devices',
            }
          : {
              id: 'assets',
              tone: 'green',
              title: 'Asset health is stable',
              body: 'No critical or offline devices in the current inventory.',
              href: '/devices',
            },
        {
          id: 'ai',
          tone: 'blue',
          title: `${scopedTickets.filter((ticket) => ticket.ai_summary).length} AI-assisted tickets`,
          body: 'Open Copilot on a ticket to generate the next update.',
          href: '/reports/ai-insights',
        },
      ],
      users,
    };
  }, [dateRange, devices, devicesLoading, tickets, ticketsLoading, user, users, usersLoading]);
}
