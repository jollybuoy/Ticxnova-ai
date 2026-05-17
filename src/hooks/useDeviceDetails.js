import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { getUserDisplayName, getUserEmail } from '../lib/user';
import {
  addDeviceNote,
  fetchDeviceActivity,
  fetchDeviceById,
  fetchDeviceNotes,
  getDeviceErrorMessage,
  updateDevice,
} from '../lib/devices/deviceService';
import { fetchDeviceTickets, getTicketDeviceErrorMessage } from '../lib/itsm/ticketDeviceService';
import { linkTicketDevices } from '../lib/itsm/ticketDeviceService';

export function useDeviceDetails(deviceId) {
  const { user } = useAuth();
  const userId = user?.id;
  const [device, setDevice] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activity, setActivity] = useState([]);
  const [relatedTickets, setRelatedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  const actor = useMemo(
    () => ({ name: getUserDisplayName(user), email: getUserEmail(user) }),
    [user],
  );

  const loadDevice = useCallback(async () => {
    if (!userId || !deviceId) return;
    setLoading(true);
    const [deviceResult, notesResult, activityResult, ticketsResult] = await Promise.all([
      fetchDeviceById(userId, deviceId),
      fetchDeviceNotes(deviceId),
      fetchDeviceActivity(deviceId),
      fetchDeviceTickets(deviceId),
    ]);
    if (deviceResult.error) {
      toast.error(getDeviceErrorMessage(deviceResult.error));
      setDevice(null);
    } else {
      setDevice(deviceResult.data);
    }
    setNotes(notesResult.data ?? []);
    setActivity(activityResult.data ?? []);
    if (ticketsResult.error) {
      toast.error(getTicketDeviceErrorMessage(ticketsResult.error));
    } else {
      setRelatedTickets(ticketsResult.data ?? []);
    }
    setLoading(false);
  }, [deviceId, userId]);

  useEffect(() => {
    loadDevice();
  }, [loadDevice]);

  useEffect(() => {
    if (!deviceId) return undefined;
    const channel = supabase
      .channel(`device-details:${deviceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices', filter: `id=eq.${deviceId}` }, (payload) => {
        if (payload.eventType === 'DELETE') setDevice(null);
        else setDevice(payload.new);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'device_notes', filter: `device_id=eq.${deviceId}` }, () => {
        fetchDeviceNotes(deviceId).then(({ data }) => setNotes(data ?? []));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'device_activity', filter: `device_id=eq.${deviceId}` }, () => {
        fetchDeviceActivity(deviceId).then(({ data }) => setActivity(data ?? []));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_devices', filter: `device_id=eq.${deviceId}` }, () => {
        fetchDeviceTickets(deviceId).then(({ data }) => setRelatedTickets(data ?? []));
        fetchDeviceActivity(deviceId).then(({ data }) => setActivity(data ?? []));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  const updateFields = useCallback(
    async (updates) => {
      if (!device || !userId) return { success: false };
      setMutating(true);
      const { data, error } = await updateDevice(userId, device, updates, actor);
      setMutating(false);
      if (error) {
        toast.error(getDeviceErrorMessage(error));
        return { success: false };
      }
      setDevice(data);
      toast.success('Device updated');
      return { success: true, data };
    },
    [actor, device, userId],
  );

  const addNote = useCallback(
    async (body) => {
      if (!body.trim() || !userId) return { success: false };
      setMutating(true);
      const { data, error } = await addDeviceNote(userId, deviceId, body, actor);
      setMutating(false);
      if (error) {
        toast.error(getDeviceErrorMessage(error));
        return { success: false };
      }
      setNotes((prev) => [...prev, data]);
      toast.success('Device note added');
      return { success: true, data };
    },
    [actor, deviceId, userId],
  );

  const attachServiceRequest = useCallback(
    async (ticketId) => {
      if (!ticketId || !userId || !deviceId) return { success: false };
      setMutating(true);
      const { error } = await linkTicketDevices(userId, ticketId, [deviceId], actor);
      setMutating(false);
      if (error) {
        toast.error(getTicketDeviceErrorMessage(error));
        return { success: false };
      }
      const { data } = await fetchDeviceTickets(deviceId);
      setRelatedTickets(data ?? []);
      toast.success('Service request attached to device');
      return { success: true };
    },
    [actor, deviceId, userId],
  );

  return {
    device,
    notes,
    activity,
    relatedTickets,
    loading,
    mutating,
    updateFields,
    addNote,
    attachServiceRequest,
    refetch: loadDevice,
  };
}
