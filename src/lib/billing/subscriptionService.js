import { supabase } from '../supabase';

export async function fetchWorkspaceSubscription(tenantId) {
  if (!tenantId) return { data: null, error: null };

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  return { data, error };
}
