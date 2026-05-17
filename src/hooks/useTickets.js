import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import {
  createTicket,
  deleteTicket,
  fetchTickets,
  getTicketErrorMessage,
  summarizeTicket,
  updateTicketStatus,
} from '../lib/tickets/ticketService';

export function useTickets() {
  const { user } = useAuth();
  const userId = user?.id;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await fetchTickets(userId);
    if (error) {
      toast.error(getTicketErrorMessage(error));
      setTickets([]);
    } else {
      setTickets(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel(`tickets:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadTickets();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTickets, userId]);

  const openCount = useMemo(
    () => tickets.filter((t) => t.status === 'open').length,
    [tickets],
  );

  const handleCreate = useCallback(
    async (payload) => {
      if (!userId) return { success: false };
      setMutating(true);
      const { data, error } = await createTicket(userId, payload);
      setMutating(false);

      if (error) {
        toast.error(getTicketErrorMessage(error));
        return { success: false };
      }

      setTickets((prev) => [data, ...prev]);
      toast.success('Ticket created successfully');
      return { success: true, data };
    },
    [userId],
  );

  const handleUpdateStatus = useCallback(
    async (ticketId, status) => {
      if (!userId) return { success: false };
      setMutating(true);
      const { data, error } = await updateTicketStatus(userId, ticketId, status);
      setMutating(false);

      if (error) {
        toast.error(getTicketErrorMessage(error));
        return { success: false };
      }

      setTickets((prev) => prev.map((t) => (t.id === ticketId ? data : t)));
      toast.success('Status updated');
      return { success: true };
    },
    [userId],
  );

  const handleDelete = useCallback(
    async (ticketId) => {
      if (!userId) return { success: false };
      setMutating(true);
      const { error } = await deleteTicket(userId, ticketId);
      setMutating(false);

      if (error) {
        toast.error(getTicketErrorMessage(error));
        return { success: false };
      }

      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      toast.success('Ticket deleted');
      return { success: true };
    },
    [userId],
  );

  const handleSummarize = useCallback(async (ticket) => {
    const { data, error } = await summarizeTicket(ticket);
    if (error) {
      toast.error(getTicketErrorMessage(error));
      return { success: false };
    }
    return { success: true, data };
  }, []);

  return {
    tickets,
    loading,
    mutating,
    openCount,
    refetch: loadTickets,
    createTicket: handleCreate,
    updateStatus: handleUpdateStatus,
    deleteTicket: handleDelete,
    summarizeTicket: handleSummarize,
  };
}
