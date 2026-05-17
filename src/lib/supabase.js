import { createClient } from '@supabase/supabase-js';

/**
 * Public Supabase client for the browser.
 * Only the anon key belongs here — never use the service role key in Vite env vars.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function readEnv(name, value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and set your Supabase project credentials.`,
    );
  }
  return trimmed;
}

function createSupabaseClient() {
  const url = readEnv('VITE_SUPABASE_URL', supabaseUrl);
  const anonKey = readEnv('VITE_SUPABASE_ANON_KEY', supabaseAnonKey);

  if (!url.startsWith('https://')) {
    throw new Error('VITE_SUPABASE_URL must be a valid HTTPS Supabase project URL.');
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/** Singleton Supabase client */
export const supabase = createSupabaseClient();

/** True when both required Vite env vars are present (safe for conditional UI). */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl?.trim() && supabaseAnonKey?.trim());
}
