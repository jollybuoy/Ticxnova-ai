import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useTenant } from './useTenant';
import { getUserDisplayName, getUserEmail } from '../lib/user';
import {
  addTicketComment,
  fetchTicketActivity,
  fetchTicketById,
  fetchTicketComments,
  getTicketErrorMessage,
  updateTicketFields,
} from '../lib/tickets/ticketService';
import {
  fetchTicketDevices,
  getTicketDeviceErrorMessage,
  replaceTicketDevices,
  unlinkTicketDevice,
} from '../lib/itsm/ticketDeviceService';

export function useTicketDetails(ticketId) {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const userId = user?.id;
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [linkedDevices, setLinkedDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  const actor = useMemo(
    () => ({
      name: getUserDisplayName(user),
      email: getUserEmail(user),
    }),
    [user],
  );

  const loadTicket = useCallback(async () => {
    if (!userId || !ticketId) return;

    setLoading(true);
    const [ticketResult, commentsResult, activityResult, devicesResult] = await Promise.all([
      fetchTicketById(userId, ticketId, tenantId),
      fetchTicketComments(userId, ticketId),
      fetchTicketActivity(ticketId),
      fetchTicketDevices(ticketId),
    ]);

    if (ticketResult.error) {
      toast.error(getTicketErrorMessage(ticketResult.error));
      setTicket(null);
    } else {
      setTicket(ticketResult.data);
    }

    if (commentsResult.error) {
      toast.error(getTicketErrorMessage(commentsResult.error));
    } else {
      setComments(commentsResult.data);
    }

    if (activityResult.error) {
      toast.error(getTicketErrorMessage(activityResult.error));
    } else {
      setActivity(activityResult.data);
    }

    if (devicesResult.error) {
      toast.error(getTicketDeviceErrorMessage(devicesResult.error));
    } else {
      setLinkedDevices(devicesResult.data);
    }

    setLoading(false);
  }, [tenantId, ticketId, userId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (!ticketId || !userId) return undefined;

    const channel = supabase
      .channel(`ticket-details:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setTicket(null);
          } else {
            setTicket(payload.new);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchTicketComments(userId, ticketId).then(({ data }) => setComments(data ?? []));
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_activity',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchTicketActivity(ticketId).then(({ data }) => setActivity(data ?? []));
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_devices',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchTicketDevices(ticketId).then(({ data }) => setLinkedDevices(data ?? []));
          fetchTicketActivity(ticketId).then(({ data }) => setActivity(data ?? []));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, userId]);

  const updateFields = useCallback(
    async (updates) => {
      if (!userId || !ticket) return { success: false };

      setMutating(true);
      const { data, error } = await updateTicketFields(userId, ticket, updates, actor);
      setMutating(false);

      if (error) {
        toast.error(getTicketErrorMessage(error));
        return { success: false };
      }

      setTicket(data);
      toast.success('Ticket updated');
      return { success: true, data };
    },
    [actor, ticket, userId],
  );

  const addComment = useCallback(
    async (body) => {
      if (!userId || !ticketId || !body.trim()) return { success: false };

      setMutating(true);
      const { data, error } = await addTicketComment(userId, ticketId, body, actor);
      setMutating(false);

      if (error) {
        toast.error(getTicketErrorMessage(error));
        return { success: false };
      }

      setComments((prev) => [...prev, data]);
      toast.success('Work note added');
      return { success: true, data };
    },
    [actor, ticketId, userId],
  );

  const updateLinkedDevices = useCallback(
    async (deviceIds) => {
      if (!userId || !ticketId) return { success: false };
      setMutating(true);
      const { error } = await replaceTicketDevices(userId, ticketId, deviceIds, actor);
      setMutating(false);
      if (error) {
        toast.error(getTicketDeviceErrorMessage(error));
        return { success: false };
      }
      const { data } = await fetchTicketDevices(ticketId);
      setLinkedDevices(data ?? []);
      toast.success('Linked devices updated');
      return { success: true };
    },
    [actor, ticketId, userId],
  );

  const removeLinkedDevice = useCallback(
    async (deviceId) => {
      if (!ticketId) return { success: false };
      setMutating(true);
      const { error } = await unlinkTicketDevice(ticketId, deviceId);
      setMutating(false);
      if (error) {
        toast.error(getTicketDeviceErrorMessage(error));
        return { success: false };
      }
      setLinkedDevices((prev) => prev.filter((device) => device.id !== deviceId));
      toast.success('Device removed from ticket');
      return { success: true };
    },
    [ticketId],
  );

  return {
    ticket,
    comments,
    activity,
    linkedDevices,
    loading,
    mutating,
    refetch: loadTicket,
    updateFields,
    addComment,
    updateLinkedDevices,
    removeLinkedDevice,
  };
}
