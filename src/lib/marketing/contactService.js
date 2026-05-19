import { supabase } from '../supabase';

export async function submitDemoRequest(payload) {
  const { data, error } = await supabase.functions.invoke('book-demo', {
    body: payload,
  });

  if (error) {
    const message =
      error.message?.includes('Failed to send a request to the Edge Function')
        ? 'Demo booking is not available yet. Deploy the book-demo Edge Function or email ticxnova-ai@jollybuoy.com directly.'
        : error.message || 'Unable to submit your demo request.';
    return { success: false, message };
  }

  if (!data?.success) {
    return { success: false, message: data?.message || 'Unable to submit your demo request.' };
  }

  return { success: true, message: data.message };
}
