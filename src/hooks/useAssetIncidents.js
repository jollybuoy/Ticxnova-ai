import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import {
  fetchAssetIncidentLinks,
  getTicketDeviceErrorMessage,
} from '../lib/itsm/ticketDeviceService';

export function useAssetIncidents() {
  const { user } = useAuth();
  const userId = user?.id;
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLinks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await fetchAssetIncidentLinks(userId);
    if (error) {
      toast.error(getTicketDeviceErrorMessage(error));
      setLinks([]);
    } else {
      setLinks(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const analytics = useMemo(() => {
    const byDevice = new Map();
    links.forEach((link) => {
      if (!link.devices || !link.tickets) return;
      const current = byDevice.get(link.device_id) ?? {
        device: link.devices,
        tickets: [],
        openTickets: [],
      };
      current.tickets.push(link.tickets);
      if (['open', 'in_progress', 'pending'].includes(link.tickets.status)) {
        current.openTickets.push(link.tickets);
      }
      byDevice.set(link.device_id, current);
    });

    const deviceRows = [...byDevice.values()].sort((a, b) => b.tickets.length - a.tickets.length);

    return {
      devicesWithMostIncidents: deviceRows.slice(0, 5),
      recurringFailures: deviceRows.filter((row) => row.tickets.length >= 3).slice(0, 5),
      unhealthyAssetsWithOpenTickets: deviceRows
        .filter((row) => row.openTickets.length > 0 && ['Warning', 'Critical', 'Offline'].includes(row.device.health_status))
        .slice(0, 5),
      trend: links
        .slice(0, 30)
        .reduce((items, link) => {
          const date = new Date(link.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          const existing = items.find((item) => item.name === date);
          if (existing) existing.incidents += 1;
          else items.push({ name: date, incidents: 1 });
          return items;
        }, [])
        .reverse(),
    };
  }, [links]);

  return { links, analytics, loading, refetch: loadLinks };
}
