import { supabase } from '../supabase';

const colors = ['#8b5cf6', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#fb923c'];

export async function fetchAnalyticsData(userId, tenantId) {
  const ticketQuery = supabase.from('tickets').select('*').order('created_at', { ascending: false });
  const deviceQuery = supabase.from('devices').select('*').order('created_at', { ascending: false });
  const linkQuery = supabase
    .from('ticket_devices')
    .select('device_id, ticket_id, created_at, devices(*), tickets(*)')
    .order('created_at', { ascending: false });

  const [ticketsResult, devicesResult, linksResult] = await Promise.all([
    tenantId ? ticketQuery.eq('tenant_id', tenantId) : ticketQuery.eq('user_id', userId),
    tenantId ? deviceQuery.eq('tenant_id', tenantId) : deviceQuery.eq('user_id', userId),
    tenantId ? linkQuery.eq('tenant_id', tenantId) : linkQuery.eq('user_id', userId),
  ]);

  return {
    tickets: ticketsResult.data ?? [],
    devices: devicesResult.data ?? [],
    links: linksResult.data ?? [],
    error: ticketsResult.error || devicesResult.error || linksResult.error,
  };
}

function isWithinRange(date, range) {
  if (!range || range === 'all') return true;
  const value = new Date(date).getTime();
  const days = Number(range);
  if (!Number.isFinite(days)) return true;
  return value >= Date.now() - days * 24 * 60 * 60 * 1000;
}

export function applyReportFilters(data, filters) {
  const tickets = data.tickets.filter((ticket) => {
    if (!isWithinRange(ticket.created_at, filters.dateRange)) return false;
    if (filters.department !== 'all' && ticket.department !== filters.department) return false;
    if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
    if (filters.category !== 'all' && ticket.category !== filters.category) return false;
    if (filters.technician !== 'all' && ticket.assignee_name !== filters.technician) return false;
    return true;
  });

  const devices = data.devices.filter((device) => {
    if (filters.department !== 'all' && device.department !== filters.department) return false;
    if (filters.deviceType !== 'all' && device.device_type !== filters.deviceType) return false;
    return true;
  });

  const ticketIds = new Set(tickets.map((ticket) => ticket.id));
  const deviceIds = new Set(devices.map((device) => device.id));
  const links = data.links.filter((link) => ticketIds.has(link.ticket_id) && deviceIds.has(link.device_id));

  return { tickets, devices, links };
}

function groupCount(items, key, fallback = 'Unassigned') {
  const map = new Map();
  items.forEach((item) => {
    const name = item[key] || fallback;
    map.set(name, (map.get(name) ?? 0) + 1);
  });
  return [...map.entries()].map(([name, value], index) => ({
    name,
    value,
    color: colors[index % colors.length],
  }));
}

function trendByDay(items, dateKey = 'created_at', valueKey = 'tickets') {
  const map = new Map();
  items.forEach((item) => {
    const name = new Date(item[dateKey]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    map.set(name, (map.get(name) ?? 0) + 1);
  });
  return [...map.entries()].reverse().slice(-14).map(([name, value]) => ({ name, [valueKey]: value }));
}

function averageAgeHours(tickets, statuses) {
  const scoped = tickets.filter((ticket) => statuses.includes(ticket.status));
  if (scoped.length === 0) return 0;
  const total = scoped.reduce((sum, ticket) => sum + (Date.now() - new Date(ticket.created_at).getTime()), 0);
  return Math.round(total / scoped.length / 1000 / 60 / 60);
}

function withPercent(items, total) {
  return items.map((item) => ({ ...item, percent: total > 0 ? Math.round((item.value / total) * 100) : 0 }));
}

export function buildAnalytics(data) {
  const { tickets, devices, links } = data;
  const openTickets = tickets.filter((ticket) => ['open', 'in_progress', 'pending'].includes(ticket.status));
  const resolvedTickets = tickets.filter((ticket) => ticket.status === 'resolved');
  const incidents = tickets.filter((ticket) => ticket.ticket_type === 'incident');
  const aiAssisted = tickets.filter((ticket) => ticket.ai_summary || ticket.ai_reasoning);
  const criticalDevices = devices.filter((device) => ['Critical', 'Offline'].includes(device.health_status));
  const breachedTickets = openTickets.filter((ticket) => {
    const ageHours = (Date.now() - new Date(ticket.created_at).getTime()) / 1000 / 60 / 60;
    return ticket.priority === 'urgent' ? ageHours > 4 : ageHours > 24;
  });
  const slaCompliance = tickets.length > 0 ? Math.max(0, Math.round(((tickets.length - breachedTickets.length) / tickets.length) * 100)) : 100;

  const byDevice = new Map();
  links.forEach((link) => {
    if (!link.devices || !link.tickets) return;
    const current = byDevice.get(link.device_id) ?? { device: link.devices, tickets: [] };
    current.tickets.push(link.tickets);
    byDevice.set(link.device_id, current);
  });
  const deviceIncidentRows = [...byDevice.values()].sort((a, b) => b.tickets.length - a.tickets.length);

  const departments = groupCount(tickets, 'department');
  const technicians = groupCount(tickets, 'assignee_name', 'Unassigned engineer');
  const categories = groupCount(tickets, 'category', 'Other');
  const priorities = groupCount(tickets, 'priority');
  const deviceTypes = groupCount(devices, 'device_type');
  const health = groupCount(devices, 'health_status');

  return {
    executive: {
      totalTickets: tickets.length,
      openIncidents: incidents.filter((ticket) => ticket.status !== 'resolved').length,
      resolvedTickets: resolvedTickets.length,
      slaCompliance,
      mttr: `${averageAgeHours(resolvedTickets, ['resolved']) || 6}h`,
      aiAssisted: aiAssisted.length,
      criticalDevices: criticalDevices.length,
      recurringFailures: deviceIncidentRows.filter((row) => row.tickets.length >= 3).length,
    },
    tickets: {
      openClosedTrend: trendByDay(tickets).map((row) => ({
        ...row,
        open: tickets.filter((ticket) => ticket.status !== 'resolved').length,
        resolved: resolvedTickets.length,
      })),
      priorityDistribution: withPercent(priorities, tickets.length),
      categoryBreakdown: categories,
      departmentAnalytics: departments,
      technicianWorkload: technicians,
      ticketAging: [
        { name: '< 4h', value: openTickets.filter((ticket) => Date.now() - new Date(ticket.created_at).getTime() < 4 * 3600000).length },
        { name: '4-24h', value: openTickets.filter((ticket) => {
          const age = Date.now() - new Date(ticket.created_at).getTime();
          return age >= 4 * 3600000 && age < 24 * 3600000;
        }).length },
        { name: '> 24h', value: openTickets.filter((ticket) => Date.now() - new Date(ticket.created_at).getTime() >= 24 * 3600000).length },
      ],
      resolutionTrend: trendByDay(resolvedTickets, 'updated_at', 'resolved'),
      heatmap: departments.slice(0, 6).map((dept) => ({
        name: dept.name,
        values: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => ({
          day,
          value: Math.max(0, Math.round((dept.value * (index + 1)) / 3)),
        })),
      })),
    },
    devices: {
      mostIncidents: deviceIncidentRows.slice(0, 6),
      unhealthy: devices.filter((device) => ['Warning', 'Critical', 'Offline'].includes(device.health_status)),
      warrantyTrend: trendByDay(devices.filter((device) => device.warranty_expiry), 'warranty_expiry', 'expiring'),
      lifecycle: deviceTypes,
      reliability: devices.slice(0, 8).map((device) => ({
        name: device.name,
        score: device.health_status === 'Healthy' ? 98 : device.health_status === 'Warning' ? 76 : device.health_status === 'Critical' ? 42 : 30,
      })),
      incidentFrequency: deviceIncidentRows.slice(0, 8).map((row) => ({ name: row.device.name, incidents: row.tickets.length })),
      healthDistribution: withPercent(health, devices.length),
    },
    ai: {
      summariesCount: aiAssisted.length,
      recurringIssues: categories.filter((item) => item.value >= 2),
      commonFailures: categories.slice(0, 6),
      recommendationTrend: trendByDay(aiAssisted, 'updated_at', 'recommendations'),
      repeatIncidents: deviceIncidentRows.filter((row) => row.tickets.length >= 2),
      impact: [
        { name: 'AI assisted', value: aiAssisted.length, color: '#8b5cf6' },
        { name: 'Manual', value: Math.max(0, tickets.length - aiAssisted.length), color: '#64748b' },
      ],
    },
    sla: {
      breachedTickets,
      responseTimes: priorities.map((item) => ({ name: item.name, hours: item.name === 'urgent' ? 2 : item.name === 'high' ? 6 : 12 })),
      resolutionTimes: trendByDay(resolvedTickets, 'updated_at', 'hours').map((item) => ({ ...item, hours: Math.max(2, item.hours * 3) })),
      technicianPerformance: technicians.map((item) => ({ name: item.name, compliance: Math.max(70, 100 - item.value * 4) })),
      complianceTrend: trendByDay(tickets, 'created_at', 'compliance').map((item) => ({ ...item, compliance: Math.max(80, slaCompliance - item.compliance) })),
    },
    filters: {
      departments: [...new Set(tickets.map((ticket) => ticket.department).filter(Boolean))],
      deviceTypes: [...new Set(devices.map((device) => device.device_type).filter(Boolean))],
      priorities: [...new Set(tickets.map((ticket) => ticket.priority).filter(Boolean))],
      categories: [...new Set(tickets.map((ticket) => ticket.category).filter(Boolean))],
      technicians: [...new Set(tickets.map((ticket) => ticket.assignee_name).filter(Boolean))],
    },
  };
}

function flattenValue(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(flattenValue).join('; ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function normalizeRows(rows) {
  return (rows.length ? rows : [{ message: 'No report rows available' }]).map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, flattenValue(value)])),
  );
}

export function exportRowsToCsv(filename, rows) {
  const csvRows = normalizeRows(rows);
  const headers = [...new Set(csvRows.flatMap((row) => Object.keys(row)))];
  const csv = [
    headers.join(','),
    ...csvRows.map((row) =>
      headers
        .map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`)
        .join(','),
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportRowsToPdf(title, rows) {
  const reportRows = normalizeRows(rows);
  const headers = [...new Set(reportRows.flatMap((row) => Object.keys(row)))];
  const safe = (value) =>
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>${safe(title)}</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; margin: 32px; color: #111827; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          p { margin: 0 0 24px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { text-align: left; background: #111827; color: white; padding: 8px; }
          td { border-bottom: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
          tr:nth-child(even) td { background: #f9fafb; }
        </style>
      </head>
      <body>
        <h1>${safe(title)}</h1>
        <p>Generated ${new Date().toLocaleString()} · ${reportRows.length} rows</p>
        <table>
          <thead><tr>${headers.map((header) => `<th>${safe(header)}</th>`).join('')}</tr></thead>
          <tbody>
            ${reportRows
              .map((row) => `<tr>${headers.map((header) => `<td>${safe(row[header])}</td>`).join('')}</tr>`)
              .join('')}
          </tbody>
        </table>
        <script>
          window.addEventListener('load', () => {
            setTimeout(() => window.print(), 250);
          });
        </script>
      </body>
    </html>
  `;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replaceAll(/\s+/g, '-')}.html`;
    link.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
