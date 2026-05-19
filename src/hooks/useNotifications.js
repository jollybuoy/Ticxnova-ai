import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '../lib/notifications/notificationService';

export function useNotifications({ limit = 30, pollWhenRealtimeOff = true } = {}) {
  const { user } = useAuth();
  const userId = user?.id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [mutating, setMutating] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await listNotifications({ limit });
    if (error) {
      // Table may not exist until enterprise-hardening.sql / saas-maturity.sql is applied
      if (error.code !== '42P01' && error.code !== 'PGRST205') {
        console.warn('Notifications unavailable:', error.message);
      }
      setItems([]);
    } else {
      setItems(data);
    }
    setLoading(false);
  }, [limit, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return undefined;
    const unsubscribe = subscribeToNotifications(userId, (row) => {
      setItems((prev) => {
        if (prev.some((n) => n.id === row.id)) return prev;
        return [row, ...prev].slice(0, limit);
      });
    });
    return unsubscribe;
  }, [limit, userId]);

  useEffect(() => {
    if (!pollWhenRealtimeOff || !userId) return undefined;
    const interval = window.setInterval(() => {
      void load();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [load, pollWhenRealtimeOff, userId]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read_at).length,
    [items],
  );

  const markRead = useCallback(
    async (notificationId) => {
      setMutating(true);
      const { error } = await markNotificationRead(notificationId);
      setMutating(false);
      if (error) {
        toast.error('Could not mark notification as read');
        return { success: false };
      }
      setItems((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      return { success: true };
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    setMutating(true);
    const { error } = await markAllNotificationsRead();
    setMutating(false);
    if (error) {
      toast.error('Could not clear notifications');
      return { success: false };
    }
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    return { success: true };
  }, []);

  return {
    notifications: items,
    unreadCount,
    loading,
    mutating,
    refetch: load,
    markRead,
    markAllRead,
  };
}
