import { Hono } from 'hono';
import type { AppEnv } from '../middleware/auth';
import { createSupabaseAdmin } from '../db/client';

const account = new Hono<AppEnv>();

/**
 * Deletes the Supabase auth user, which cascades to every `user_id`-owned
 * table via `on delete cascade` in the migration (audit_events uses
 * `on delete set null` deliberately, to keep an anonymized audit trail).
 */
account.delete('/', async (c) => {
  const admin = createSupabaseAdmin(c.env);
  const { error } = await admin.auth.admin.deleteUser(c.var.userId);
  if (error) return c.json({ error: error.message }, 500);
  return c.body(null, 204);
});

export { account };
