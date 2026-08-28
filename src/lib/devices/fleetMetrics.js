import { formatAge } from '../tickets/incidentModel';
import { DEVICE_TYPES, isWarrantyExpiring } from './constants';

export const HEALTH_SCORES = {
  Healthy: 92,
  Warning: 62,
  Critical: 28,
  Offline: 18,
};

export function healthScore(device) {
  let score = HEALTH_SCORES[device?.health_status] ?? 80;
  if (isWarrantyExpiring(device)) score -= 8;
  if (!device?.assigned_user?.trim()) score -= 4;
  return Math.max(8, Math.min(99, score));
}

export function healthTone(score) {
  if (score >= 80) return { color: '#34d399', label: 'Healthy', text: 'text-emerald-300' };
  if (score >= 50) return { color: '#fbbf24', label: 'Needs attention', text: 'text-amber-300' };
  return { color: '#f87171', label: 'Critical', text: 'text-red-300' };
}

export function osLabel(device) {
  const maker = String(device?.manufacturer || '').toLowerCase();
  const type = device?.device_type;
  if (type === 'Mobile Device') return maker.includes('apple') ? 'iOS' : 'Android';
  if (type === 'Network Device') return 'Network OS';
  if (type === 'Server') return maker.includes('linux') ? 'Linux' : 'Windows Server';
  if (maker.includes('apple') || maker.includes('mac')) return 'macOS';
  return 'Windows 11';
}

export function lifecycleLabel(device) {
  return device?.assigned_user?.trim() ? 'In use' : 'In stock';
}

export function isCompliant(device) {
  return device?.health_status === 'Healthy' && !isWarrantyExpiring(device);
}

export function lastSeen(device) {
  return formatAge(device?.updated_at || device?.created_at);
}

export function getFleetBreakdown(devices = []) {
  const healthy = devices.filter((device) => device.health_status === 'Healthy').length;
  const attention = devices.filter((device) => device.health_status === 'Warning').length;
  const critical = devices.filter((device) => device.health_status === 'Critical').length;
  const offline = devices.filter((device) => device.health_status === 'Offline').length;
  const assigned = devices.filter((device) => device.assigned_user?.trim()).length;
  const inStock = devices.length - assigned;
  const warranty = devices.filter(isWarrantyExpiring).length;
  return {
    total: devices.length,
    healthy,
    attention,
    critical,
    offline,
    assigned,
    inStock,
    warranty,
    unmanagedRisk: attention + critical + offline,
  };
}

export function categoryDistribution(devices = []) {
  const colors = {
    Laptop: '#8b5cf6',
    Desktop: '#60a5fa',
    Server: '#34d399',
    'Network Device': '#fb923c',
    'Mobile Device': '#f472b6',
  };
  const items = DEVICE_TYPES.map((type) => ({
    name: type.label.replace(' Device', ''),
    value: devices.filter((device) => device.device_type === type.value).length,
    color: colors[type.value] || '#94a3b8',
  })).filter((item) => item.value > 0);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return items.map((item) => ({
    ...item,
    percent: total ? Math.round((item.value / total) * 100) : 0,
  }));
}

export function lifecycleTrend(devices = []) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return {
      name: date.toLocaleDateString(undefined, { month: 'short' }),
      start: date.getTime(),
    };
  });
  return months.map((month, index) => {
    const next = months[index + 1]?.start ?? Date.now();
    const knownByThen = devices.filter((device) => new Date(device.created_at || 0).getTime() < next);
    return {
      name: month.name,
      inUse: knownByThen.filter((device) => device.assigned_user?.trim()).length,
      inStock: knownByThen.filter((device) => !device.assigned_user?.trim()).length,
      retired: 0,
    };
  });
}

export function deviceAlerts(devices = []) {
  const fleet = getFleetBreakdown(devices);
  return [
    fleet.critical && { id: 'critical', tone: 'red', label: 'Critical devices', value: fleet.critical },
    fleet.offline && { id: 'offline', tone: 'orange', label: 'Offline / unreachable', value: fleet.offline },
    fleet.attention && { id: 'attention', tone: 'yellow', label: 'Need attention', value: fleet.attention },
    fleet.warranty && { id: 'warranty', tone: 'orange', label: 'Warranty risk', value: fleet.warranty },
  ].filter(Boolean);
}

export function systemStatus(device) {
  const warranty = isWarrantyExpiring(device);
  const expired = device?.warranty_expiry && new Date(device.warranty_expiry).getTime() < Date.now();
  return [
    {
      label: 'Assignment',
      value: device?.assigned_user?.trim() || 'Unassigned',
      tone: device?.assigned_user?.trim() ? 'green' : 'orange',
    },
    {
      label: 'Health',
      value: device?.health_status || 'Unknown',
      tone: device?.health_status === 'Healthy' ? 'green' : device?.health_status === 'Warning' ? 'yellow' : 'red',
    },
    {
      label: 'Warranty',
      value: expired ? 'Expired' : warranty ? 'Expiring' : device?.warranty_expiry ? 'Active' : 'Unknown',
      tone: expired || warranty ? 'orange' : 'green',
    },
    {
      label: 'Serial',
      value: device?.serial_number || 'Missing',
      tone: device?.serial_number ? 'green' : 'yellow',
    },
    {
      label: 'Location',
      value: device?.location || 'Not set',
      tone: device?.location ? 'green' : 'yellow',
    },
  ];
}
