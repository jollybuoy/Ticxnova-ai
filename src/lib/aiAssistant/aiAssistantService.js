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

  const name = error.name ?? '';
  const message = error.message ?? '';

  if (name === 'FunctionsFetchError' || message.includes('Failed to send a request')) {
    return [
      'Could not reach the ai-assistant Edge Function.',
      'Check that it is deployed to the same Supabase project as VITE_SUPABASE_URL and that OPENAI_API_KEY is set.',
    ].join(' ');
  }

  if (message.includes('non-2xx status code')) {
    return 'The ai-assistant Edge Function responded with an error. Check Supabase function logs for details.';
  }

  return message || 'The AI assistant could not respond. Please try again.';
}
