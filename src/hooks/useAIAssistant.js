import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import {
  getAIAssistantErrorMessage,
  sendAIAssistantMessage,
} from '../lib/aiAssistant/aiAssistantService';
import { createTicket, getTicketErrorMessage } from '../lib/tickets/ticketService';
import { getUserDisplayName } from '../lib/user';
import { useDevices } from './useDevices';

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hi, I’m Ticxnova-AI Copilot. Describe the IT issue and I’ll help troubleshoot it step by step.',
  createdAt: new Date().toISOString(),
};

function createMessage(role, content, extra = {}) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

const confirmationPhrases = ['yes', 'confirm', 'proceed', 'create it', 'create ticket', 'go ahead'];
const declinePhrases = ['no', 'no thanks', 'not now', 'cancel', 'skip'];

function isTicketConfirmation(message) {
  const normalized = message.trim().toLowerCase().replace(/[.!?]/g, '');
  return confirmationPhrases.some((phrase) => normalized === phrase || normalized.includes(phrase));
}

function isTicketDecline(message) {
  const normalized = message.trim().toLowerCase().replace(/[.!?]/g, '');
  return declinePhrases.some((phrase) => normalized === phrase || normalized.includes(phrase));
}

function findPendingTicketProposal(messages) {
  return [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === 'assistant' &&
        message.ticketDraft &&
        !message.ticketCreated &&
        !message.ticketDeclined,
    );
}

function normalizeTicketDraft(draft, fallbackText) {
  const base = draft ?? {};
  const summary = base.summary || base.description || fallbackText;

  return {
    title: base.title || fallbackText.slice(0, 80) || 'AI Assistant Support Request',
    description:
      base.description ||
      `Created from AI Assistant conversation:\n\n${fallbackText}`,
    summary,
    category: base.category || 'Other',
    priority: base.priority || 'medium',
    department: base.department || 'IT Operations',
    ticket_type:
      base.category === 'Device Request'
        ? 'service_request'
        : base.ticket_type || base.ticketType || 'incident',
    device_ids: base.device_ids || base.deviceIds || [],
  };
}

function formatTicketCreatedAt(iso) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function useAIAssistant() {
  const { user } = useAuth();
  const { devices } = useDevices();
  const storageKey = useMemo(
    () => (user?.id ? `ticxnova-ai-assistant:${user.id}` : null),
    [user?.id],
  );
  const [messages, setMessages] = useState([welcomeMessage]);
  const [loading, setLoading] = useState(false);
  const [creatingTicketId, setCreatingTicketId] = useState(null);

  useEffect(() => {
    if (!storageKey) return;

    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
      }
    } catch (_error) {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const createTicketFromMessage = useCallback(
    async (message, editedDraft) => {
      if (!user?.id || !message?.ticketDraft || message.ticketCreated) return null;

      setCreatingTicketId(message.id);
      const draft = normalizeTicketDraft(editedDraft ?? message.ticketDraft, message.content);
      const { data, error } = await createTicket(user.id, {
        title: draft.title || 'AI Assistant Support Request',
        description:
          draft.description ||
          draft.summary ||
          `Created from AI Assistant conversation:\n\n${message.content}`,
        category: draft.category || 'Other',
        priority: draft.priority || 'medium',
        ticket_type: draft.ticket_type || 'incident',
        department: draft.department || 'IT Operations',
        device_ids: draft.device_ids || [],
        ai_summary: draft.summary || draft.description || message.content,
        ai_suggested_category: draft.category || 'Other',
        ai_suggested_priority: draft.priority || 'medium',
        ai_reasoning: 'Generated from AI Assistant conversation after user confirmation.',
        requester_name: getUserDisplayName(user),
      });
      setCreatingTicketId(null);

      if (error) {
        toast.error(getTicketErrorMessage(error));
        return null;
      }

      setMessages((prev) =>
        prev.map((item) =>
          item.id === message.id
            ? {
                ...item,
                ticketDraft: draft,
                ticketCreated: true,
                ticketId: data.id,
                ticketNumber: data.ticket_number,
                ticketCreatedAt: formatTicketCreatedAt(data.created_at),
              }
            : item,
        ),
      );
      setMessages((prev) => [
        ...prev,
        createMessage(
          'assistant',
          `Created ${data.ticket_number} and routed it to ${data.department || draft.department || 'IT Operations'}. Status is Open.`,
        ),
      ]);
      toast.success(`Ticket ${data.ticket_number} created`);
      return data;
    },
    [user],
  );

  const prepareTicketProposal = useCallback((message) => {
    if (!message?.ticketDraft || message.ticketCreated || message.ticketDeclined) return;

    setMessages((prev) =>
      prev.map((item) =>
        item.id === message.id
          ? {
              ...item,
              proposalReady: true,
              ticketDraft: normalizeTicketDraft(item.ticketDraft, item.content),
            }
          : item,
      ),
    );

    setMessages((prev) => [
      ...prev,
      createMessage(
        'assistant',
        'Here are the proposed ticket details. Please review and update anything needed, then confirm creation.',
      ),
    ]);
  }, []);

  const declineTicketProposal = useCallback((message) => {
    if (!message?.ticketDraft || message.ticketCreated) return;

    setMessages((prev) =>
      prev.map((item) =>
        item.id === message.id
          ? {
              ...item,
              ticketDeclined: true,
            }
          : item,
      ),
    );

    setMessages((prev) => [
      ...prev,
      createMessage(
        'assistant',
        'No problem. I’m glad I could help. If the issue comes back or you need anything else, just let me know.',
      ),
    ]);
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      const trimmed = content.trim();
      if (!trimmed || loading) return;

      const pendingProposal = findPendingTicketProposal(messages);
      const userMessage = createMessage('user', trimmed);
      const history = [...messages, userMessage];
      setMessages(history);

      if (pendingProposal && isTicketDecline(trimmed)) {
        declineTicketProposal(pendingProposal);
        return;
      }

      if (pendingProposal && isTicketConfirmation(trimmed)) {
        if (pendingProposal.proposalReady) {
          await createTicketFromMessage(pendingProposal);
          return;
        }

        prepareTicketProposal(pendingProposal);
        return;
      }

      setLoading(true);

      const { data, error } = await sendAIAssistantMessage({
        message: trimmed,
        history,
        deviceContext: devices.map((device) => ({
          id: device.id,
          name: device.name,
          asset_tag: device.asset_tag,
          device_type: device.device_type,
          department: device.department,
          health_status: device.health_status,
          assigned_user: device.assigned_user,
        })),
      });

      setLoading(false);

      if (error) {
        toast.error(getAIAssistantErrorMessage(error));
        setMessages((prev) => [
          ...prev,
          createMessage(
            'assistant',
            'I ran into an issue generating a response. Please try again in a moment.',
            { isError: true },
          ),
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        createMessage('assistant', data.response, {
          shouldCreateTicket: Boolean(data.shouldCreateTicket),
          ticketDraft: data.shouldCreateTicket
            ? normalizeTicketDraft(data.ticketDraft, trimmed)
            : null,
          proposalReady: false,
        }),
      ]);
    },
    [createTicketFromMessage, declineTicketProposal, devices, loading, messages, prepareTicketProposal],
  );

  const clearConversation = useCallback(() => {
    setMessages([{ ...welcomeMessage, createdAt: new Date().toISOString() }]);
    if (storageKey) {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    messages,
    loading,
    creatingTicketId,
    sendMessage,
    clearConversation,
    createTicketFromMessage,
    prepareTicketProposal,
    declineTicketProposal,
  };
}
