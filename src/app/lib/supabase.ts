import { createClient, SupabaseClient } from '@supabase/supabase-js';

/*
  ──────────────────────────────────────────────
  SUPABASE SETUP — run this SQL in your Supabase
  SQL Editor before using the sync feature:
  ──────────────────────────────────────────────

  CREATE TABLE IF NOT EXISTS habit_sync (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    ciphertext   TEXT NOT NULL,
    salt         TEXT NOT NULL,
    iv           TEXT NOT NULL,
    updated_at   TIMESTAMPTZ DEFAULT now()
  );

  ALTER TABLE habit_sync ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users manage own data"
    ON habit_sync FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  ──────────────────────────────────────────────
*/

export const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
export const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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
  user_id:    string;
  ciphertext: string;
  salt:       string;
  iv:         string;
  updated_at: string;
};
