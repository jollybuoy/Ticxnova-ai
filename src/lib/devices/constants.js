export const DEVICE_STATUSES = [
  { value: 'Healthy', label: 'Healthy', badge: 'green' },
  { value: 'Warning', label: 'Warning', badge: 'yellow' },
  { value: 'Critical', label: 'Critical', badge: 'red' },
  { value: 'Offline', label: 'Offline', badge: 'slate' },
];

export const DEVICE_TYPES = [
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Desktop', label: 'Desktop' },
  { value: 'Server', label: 'Server' },
  { value: 'Network Device', label: 'Network Device' },
  { value: 'Mobile Device', label: 'Mobile Device' },
];

export function getDeviceStatusMeta(status) {
  return DEVICE_STATUSES.find((item) => item.value === status) ?? DEVICE_STATUSES[0];
}

export function formatDeviceDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function isWarrantyExpiring(device) {
  if (!device.warranty_expiry) return false;
  const expiry = new Date(device.warranty_expiry).getTime();
  const soon = Date.now() + 1000 * 60 * 60 * 24 * 60;
  return expiry <= soon;
}

export function getDeviceStats(devices) {
  const unhealthy = devices.filter((d) => ['Warning', 'Critical', 'Offline'].includes(d.health_status));
  const warrantyAlerts = devices.filter(isWarrantyExpiring);
  const byStatus = DEVICE_STATUSES.map((status) => ({
    name: status.label,
    value: devices.filter((d) => d.health_status === status.value).length,
    color:
      status.value === 'Healthy'
        ? '#34d399'
        : status.value === 'Warning'
          ? '#fbbf24'
          : status.value === 'Critical'
            ? '#f87171'
            : '#64748b',
  }));
  const byType = DEVICE_TYPES.map((type) => ({
    name: type.label,
    value: devices.filter((d) => d.device_type === type.value).length,
  })).filter((item) => item.value > 0);

  return {
    total: devices.length,
    unhealthy: unhealthy.length,
    warrantyAlerts: warrantyAlerts.length,
    byStatus,
    byType,
  };
}
