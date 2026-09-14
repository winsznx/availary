import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../../shared/types';

/**
 * Service-role Supabase client. Used only inside the Worker — this key
 * bypasses RLS, so it must never reach the browser (see `WorkerEnv` and
 * `.env.example`: only `VITE_SUPABASE_ANON_KEY` is client-safe).
 */
export function createSupabaseAdmin(env: WorkerEnv): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Verifies a user's access token and returns their id, or null if invalid/expired. */
export async function resolveUserId(
  admin: SupabaseClient,
  accessToken: string,
): Promise<string | null> {
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user.id;
}
