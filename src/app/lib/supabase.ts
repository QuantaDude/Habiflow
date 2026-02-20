import { createClient, SupabaseClient } from '@supabase/supabase-js';


export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL) && Boolean(SUPABASE_KEY);
}

// Lazily created — only instantiated after env vars are confirmed present.
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.');
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _client;
}

export type SyncRow = {
  user_id: string;
  ciphertext: string;
  salt: string;
  iv: string;
  updated_at: string;
};
