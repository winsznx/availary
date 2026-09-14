import { Hono } from 'hono';
import type { AppEnv } from '../middleware/auth';
import { createSupabaseAdmin } from '../db/client';

const health = new Hono<AppEnv>();

/**
 * Public, unauthenticated. Verifies wiring (Supabase reachable, CALL-E key
 * present) without ever placing a call or reading user data — a deployment
 * check should never cost a CALL-E credit.
 */
health.get('/', async (c) => {
  let supabaseOk = false;
  if (c.env.SUPABASE_URL && c.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createSupabaseAdmin(c.env);
      const { error } = await admin.from('care_needs').select('id').limit(1);
      supabaseOk = !error;
    } catch {
      supabaseOk = false;
    }
  }

  return c.json({
    ok: supabaseOk,
    supabase: supabaseOk,
    calleConfigured: c.env.CALLE_API_KEY.length > 0,
    liveCallsEnabled: c.env.AVAILARY_LIVE_CALLS === 'true',
  });
});

export { health };
