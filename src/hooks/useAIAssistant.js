import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  getAIAssistantErrorMessage,
  sendAIAssistantMessage,
} from '../lib/aiAssistant/aiAssistantService';

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

export function useAIAssistant() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (content) => {
      const trimmed = content.trim();
      if (!trimmed || loading) return;

      const userMessage = createMessage('user', trimmed);
      const history = [...messages, userMessage];
      setMessages(history);
      setLoading(true);

      const { data, error } = await sendAIAssistantMessage({
        message: trimmed,
        history,
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
        }),
      ]);
    },
    [loading, messages],
  );

  const clearConversation = useCallback(() => {
    setMessages([{ ...welcomeMessage, createdAt: new Date().toISOString() }]);
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    clearConversation,
  };
}
