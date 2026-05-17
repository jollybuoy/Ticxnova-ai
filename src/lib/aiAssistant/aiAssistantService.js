import { supabase } from '../supabase';

export async function sendAIAssistantMessage({ message, history }) {
  const { data, error } = await supabase.functions.invoke('ai-assistant', {
    body: {
      message,
      history: history.slice(-10).map((item) => ({
        role: item.role,
        content: item.content,
      })),
    },
  });

  return { data, error };
}

export function getAIAssistantErrorMessage(error) {
  if (!error) return 'The AI assistant could not respond. Please try again.';
  return error.message ?? 'The AI assistant could not respond. Please try again.';
}
