import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import {
  createTicket,
  deleteTicket,
  fetchTickets,
  getTicketErrorMessage,
  summarizeTicket,
  updateTicketFields,
} from '../lib/tickets/ticketService';
import { getUserDisplayName, getUserEmail } from '../lib/user';
import { useTenant } from './useTenant';
import { useSubscriptionAccess } from './useSubscriptionAccess';
import { MODULES } from '../lib/rbac/modulePermissions';
import { ACTIONS } from '../lib/rbac/actionPermissions';
import { AUDIT_ACTIONS, AUDIT_MODULES, recordAuditLog } from '../lib/audit/auditService';

const ticketsCache = { key: null, data: [] };

function ticketsCacheKey(userId, tenantId) {
  return `${userId ?? ''}:${tenantId ?? ''}`;
}

function readTicketsCache(userId, tenantId) {
  return ticketsCache.key === ticketsCacheKey(userId, tenantId) ? ticketsCache.data : [];
}

function writeTicketsCache(userId, tenantId, data) {
  ticketsCache.key = ticketsCacheKey(userId, tenantId);
  ticketsCache.data = data;
}

export function useTickets() {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const { canWrite, canPerformAction } = useSubscriptionAccess();
  const userId = user?.id;
  const channelId = useRef(crypto.randomUUID());

  const [tickets, setTickets] = useState(() => readTicketsCache(userId, tenantId));
  const [loading, setLoading] = useState(() => readTicketsCache(userId, tenantId).length === 0);
  const [mutating, setMutating] = useState(false);

  const loadTickets = useCallback(async (options = {}) => {
    const { background = false } = options;
    if (!userId) {
      setTickets([]);
      setLoading(false);
      ticketsCache.key = null;
      ticketsCache.data = [];
      return;
    }

    if (!background && readTicketsCache(userId, tenantId).length === 0) {
      setLoading(true);
    }

    const { data, error } = await fetchTickets(userId, tenantId);
    if (error) {
      toast.error(getTicketErrorMessage(error));
      setTickets([]);
      writeTicketsCache(userId, tenantId, []);
    } else {
      setTickets(data);
      writeTicketsCache(userId, tenantId, data);
    }
    setLoading(false);
  }, [tenantId, userId]);

  useEffect(() => {
    const cached = readTicketsCache(userId, tenantId);
    if (cached.length) {
      setTickets(cached);
      setLoading(false);
      loadTickets({ background: true });
      return;
    }
    loadTickets();
  }, [loadTickets, tenantId, userId]);

  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel(`tickets:${userId}:${channelId.current}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadTickets({ background: true });
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
      if (!canWrite(MODULES.TICKETS, ACTIONS.CREATE)) {
        toast.error('You cannot create tickets in the current workspace mode.');
        return { success: false };
      }
      setMutating(true);
      const { data, error } = await createTicket(userId, { ...payload, tenant_id: tenantId });
      setMutating(false);

      if (error) {
        toast.error(getTicketErrorMessage(error));
        return { success: false };
      }

      setTickets((prev) => {
        const next = [data, ...prev];
        writeTicketsCache(userId, tenantId, next);
        return next;
      });
      void recordAuditLog({
        tenantId,
        actorId: userId,
        actorEmail: getUserEmail(user),
        module: AUDIT_MODULES.TICKETS,
        action: AUDIT_ACTIONS.CREATED,
        entityType: 'ticket',
        entityId: data.id,
        summary: `Created ticket ${data.ticket_number ?? data.id}`,
        newValue: { title: data.title, status: data.status },
      });
      toast.success('Ticket created successfully');
      return { success: true, data };
    },
    [canWrite, tenantId, user, userId],
  );

  const handleUpdateStatus = useCallback(
    async (ticketId, status) => {
      if (!userId) return { success: false };
      if (!canWrite(MODULES.TICKETS, ACTIONS.UPDATE)) {
        toast.error('You cannot update tickets in the current workspace mode.');
        return { success: false };
      }
      const ticket = tickets.find((item) => item.id === ticketId);
      if (!ticket) return { success: false };

      setMutating(true);
      const { data, error } = await updateTicketFields(
        userId,
        ticket,
        { status },
        {
          name: getUserDisplayName(user),
          email: getUserEmail(user),
        },
      );
      setMutating(false);

      if (error) {
        toast.error(getTicketErrorMessage(error));
        return { success: false };
      }

      setTickets((prev) => {
        const next = prev.map((t) => (t.id === ticketId ? data : t));
        writeTicketsCache(userId, tenantId, next);
        return next;
      });
      void recordAuditLog({
        tenantId,
        actorId: userId,
        actorEmail: getUserEmail(user),
        module: AUDIT_MODULES.TICKETS,
        action: AUDIT_ACTIONS.STATUS_CHANGED,
        entityType: 'ticket',
        entityId: ticketId,
        summary: `Status changed to ${status}`,
        oldValue: { status: ticket.status },
        newValue: { status },
      });
      toast.success('Status updated');
      return { success: true };
    },
    [canWrite, tenantId, tickets, user, userId],
  );

  const handleDelete = useCallback(
    async (ticketId) => {
      if (!userId) return { success: false };
      if (!canPerformAction(MODULES.TICKETS, ACTIONS.DELETE)) {
        toast.error('You do not have permission to delete tickets.');
        return { success: false };
      }
      setMutating(true);
      const { error } = await deleteTicket(userId, ticketId);
      setMutating(false);

      if (error) {
        toast.error(getTicketErrorMessage(error));
        return { success: false };
      }

      setTickets((prev) => {
        const next = prev.filter((t) => t.id !== ticketId);
        writeTicketsCache(userId, tenantId, next);
        return next;
      });
      void recordAuditLog({
        tenantId,
        actorId: userId,
        actorEmail: getUserEmail(user),
        module: AUDIT_MODULES.TICKETS,
        action: AUDIT_ACTIONS.DELETED,
        entityType: 'ticket',
        entityId: ticketId,
        summary: `Deleted ticket ${ticketId}`,
      });
      toast.success('Ticket deleted');
      return { success: true };
    },
    [canPerformAction, tenantId, user, userId],
  );

  const handleSummarize = useCallback(
    async (ticket) => {
      if (!userId) return { success: false };

      const { data, error } = await summarizeTicket(userId, ticket);
      if (error) {
        toast.error(getTicketErrorMessage(error));
        return { success: false };
      }

      setTickets((prev) => {
        const next = prev.map((t) => (t.id === ticket.id ? data : t));
        writeTicketsCache(userId, tenantId, next);
        return next;
      });
      toast.success('AI summary saved to ticket');
      return { success: true, data };
    },
    [userId],
  );

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
