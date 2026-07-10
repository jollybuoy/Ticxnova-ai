import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { getUserDisplayName, getUserEmail } from '../lib/user';
import {
  createDevice,
  deleteDevice,
  fetchDevices,
  getDeviceErrorMessage,
  updateDevice,
} from '../lib/devices/deviceService';
import {
  getTicketDeviceErrorMessage,
  linkTicketDevices,
} from '../lib/itsm/ticketDeviceService';
import { useTenant } from './useTenant';

function uniqueDevices(devices) {
  return [...new Map(devices.map((device) => [device.id, device])).values()];
}

const devicesCache = { key: null, data: [] };

function devicesCacheKey(userId, tenantId) {
  return `${userId ?? ''}:${tenantId ?? ''}`;
}

function readDevicesCache(userId, tenantId) {
  return devicesCache.key === devicesCacheKey(userId, tenantId) ? devicesCache.data : [];
}

function writeDevicesCache(userId, tenantId, data) {
  devicesCache.key = devicesCacheKey(userId, tenantId);
  devicesCache.data = data;
}

export function useDevices() {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const userId = user?.id;
  const channelId = useRef(crypto.randomUUID());
  const [devices, setDevices] = useState(() => readDevicesCache(userId, tenantId));
  const [loading, setLoading] = useState(() => readDevicesCache(userId, tenantId).length === 0);
  const [mutating, setMutating] = useState(false);

  const actor = useMemo(
    () => ({ name: getUserDisplayName(user), email: getUserEmail(user) }),
    [user],
  );

  const loadDevices = useCallback(async (options = {}) => {
    const { background = false } = options;
    if (!userId) return;

    if (!background && readDevicesCache(userId, tenantId).length === 0) {
      setLoading(true);
    }

    const { data, error } = await fetchDevices(userId, tenantId);
    if (error) {
      toast.error(getDeviceErrorMessage(error));
      setDevices([]);
      writeDevicesCache(userId, tenantId, []);
    } else {
      const next = uniqueDevices(data);
      setDevices(next);
      writeDevicesCache(userId, tenantId, next);
    }
    setLoading(false);
  }, [tenantId, userId]);

  useEffect(() => {
    const cached = readDevicesCache(userId, tenantId);
    if (cached.length) {
      setDevices(cached);
      setLoading(false);
      loadDevices({ background: true });
      return;
    }
    loadDevices();
  }, [loadDevices, tenantId, userId]);

  useEffect(() => {
    if (!userId) return undefined;
    const channel = supabase
      .channel(`devices:${userId}:${channelId.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices', filter: `user_id=eq.${userId}` },
        () => loadDevices({ background: true }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDevices, userId]);

  const handleCreate = useCallback(
    async (payload) => {
      setMutating(true);
      const { data, error } = await createDevice(userId, { ...payload, tenant_id: tenantId }, actor);
      if (error) {
        setMutating(false);
        toast.error(getDeviceErrorMessage(error));
        return { success: false };
      }
      if (payload.service_request_id) {
        const { error: linkError } = await linkTicketDevices(
          userId,
          payload.service_request_id,
          [data.id],
          { ...actor, tenantId },
        );
        if (linkError) {
          await deleteDevice(userId, data.id);
          setMutating(false);
          toast.error(getTicketDeviceErrorMessage(linkError));
          return { success: false };
        }
      }
      setMutating(false);
      setDevices((prev) => {
        const next = uniqueDevices([data, ...prev]);
        writeDevicesCache(userId, tenantId, next);
        return next;
      });
      toast.success('Device added');
      return { success: true, data };
    },
    [actor, tenantId, userId],
  );

  const handleUpdate = useCallback(
    async (device, updates) => {
      setMutating(true);
      const { data, error } = await updateDevice(userId, device, updates, actor);
      setMutating(false);
      if (error) {
        toast.error(getDeviceErrorMessage(error));
        return { success: false };
      }
      setDevices((prev) => {
        const next = prev.map((item) => (item.id === data.id ? data : item));
        writeDevicesCache(userId, tenantId, next);
        return next;
      });
      toast.success('Device updated');
      return { success: true, data };
    },
    [actor, userId],
  );

  const handleDelete = useCallback(
    async (deviceId) => {
      setMutating(true);
      const { error } = await deleteDevice(userId, deviceId);
      setMutating(false);
      if (error) {
        toast.error(getDeviceErrorMessage(error));
        return { success: false };
      }
      setDevices((prev) => {
        const next = prev.filter((item) => item.id !== deviceId);
        writeDevicesCache(userId, tenantId, next);
        return next;
      });
      toast.success('Device deleted');
      return { success: true };
    },
    [userId],
  );

  return {
    devices,
    loading,
    mutating,
    refetch: loadDevices,
    createDevice: handleCreate,
    updateDevice: handleUpdate,
    deleteDevice: handleDelete,
  };
}
