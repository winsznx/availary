import { Hono } from 'hono';
import type { AppEnv } from '../middleware/auth';
import { createSupabaseAdmin } from '../db/client';
import { mapEvidenceRow } from '../db/mappers';
import type { ObservationEvidenceRow } from '../../shared/types';

const observations = new Hono<AppEnv>();

observations.get('/:id/evidence', async (c) => {
  const admin = createSupabaseAdmin(c.env);
  const { data, error } = await admin
    .from('observation_evidence')
    .select('*')
    .eq('user_id', c.var.userId)
    .eq('observation_id', c.req.param('id'))
    .order('created_at', { ascending: true })
    .returns<ObservationEvidenceRow[]>();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data.map(mapEvidenceRow));
});

export { observations };
