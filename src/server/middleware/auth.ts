import type { MiddlewareHandler } from 'hono';
import { createSupabaseAdmin, resolveUserId } from '../db/client';
import type { WorkerEnv } from '../../shared/types';

export type AppEnv = {
  Bindings: WorkerEnv;
  Variables: { userId: string };
};

/**
 * Every route mounted behind this requires a real, currently-valid Supabase
 * session — this is the "authenticated user" gate the live-call rule depends
 * on (TECHNICAL-SPEC.md / CLAUDE-HANDOFF.md). No route places a call, reads,
 * or writes user data without passing through here first.
 */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

  if (!token) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const admin = createSupabaseAdmin(c.env);
  const userId = await resolveUserId(admin, token);
  if (!userId) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  c.set('userId', userId);
  await next();
};
