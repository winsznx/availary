import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Present only when real credentials are configured. `src/main.tsx` uses
 * this to decide fixture vs real adapters — local dev with no `.env`
 * Supabase values still boots cleanly on fixtures (public demo rule).
 */
export const supabaseBrowserClient: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
