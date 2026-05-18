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

export function useDevices() {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const userId = user?.id;
  const channelId = useRef(crypto.randomUUID());
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  const actor = useMemo(
    () => ({ name: getUserDisplayName(user), email: getUserEmail(user) }),
    [user],
  );

  const loadDevices = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await fetchDevices(userId, tenantId);
    if (error) {
      toast.error(getDeviceErrorMessage(error));
      setDevices([]);
    } else {
      setDevices(uniqueDevices(data));
    }
    setLoading(false);
  }, [tenantId, userId]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    if (!userId) return undefined;
    const channel = supabase
      .channel(`devices:${userId}:${channelId.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices', filter: `user_id=eq.${userId}` },
        () => loadDevices(),
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
      setDevices((prev) => uniqueDevices([data, ...prev]));
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
      setDevices((prev) => prev.map((item) => (item.id === data.id ? data : item)));
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
      setDevices((prev) => prev.filter((item) => item.id !== deviceId));
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
