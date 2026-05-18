import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useTenant } from './useTenant';
import {
  applyReportFilters,
  buildAnalytics,
  fetchAnalyticsData,
} from '../lib/reports/analyticsService';
import { defaultReportFilters } from '../lib/reports/filterDefaults';

export function useAnalytics(filters = defaultReportFilters) {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const userId = user?.id;
  const [rawData, setRawData] = useState({ tickets: [], devices: [], links: [] });
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { tickets, devices, links, error } = await fetchAnalyticsData(userId, tenantId);
    if (error) {
      toast.error(error.message ?? 'Unable to load analytics data');
      setRawData({ tickets: [], devices: [], links: [] });
    } else {
      setRawData({ tickets, devices, links });
    }
    setLoading(false);
  }, [tenantId, userId]);

  useEffect(() => {
    const task = window.setTimeout(() => {
      loadAnalytics();
    }, 0);
    return () => window.clearTimeout(task);
  }, [loadAnalytics]);

  useEffect(() => {
    if (!userId) return undefined;
    const channel = supabase
      .channel(`analytics:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `user_id=eq.${userId}` }, loadAnalytics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices', filter: `user_id=eq.${userId}` }, loadAnalytics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_devices', filter: `user_id=eq.${userId}` }, loadAnalytics)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAnalytics, userId]);

  const filteredData = useMemo(
    () => applyReportFilters(rawData, filters),
    [rawData, filters],
  );

  const analytics = useMemo(() => buildAnalytics(filteredData), [filteredData]);
  const filterOptions = useMemo(() => buildAnalytics(rawData).filters, [rawData]);

  return {
    analytics,
    data: filteredData,
    filterOptions,
    loading,
    refetch: loadAnalytics,
  };
}
