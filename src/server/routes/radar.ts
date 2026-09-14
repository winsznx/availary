import { Hono } from 'hono';
import type { AppEnv } from '../middleware/auth';
import { createSupabaseAdmin } from '../db/client';
import { mapCareNeedRow, mapObservationRow, mapProviderRow } from '../db/mappers';
import { computeFreshness, needsRecheck } from '../../domain/freshness';
import type { RadarEntry } from '../../domain/types';
import type { CapacityObservationRow, CareNeedRow, ProviderRow } from '../../shared/types';

const radar = new Hono<AppEnv>();

radar.get('/:careNeedId', async (c) => {
  const admin = createSupabaseAdmin(c.env);
  const userId = c.var.userId;
  const careNeedId = c.req.param('careNeedId');

  const [careNeedResult, providersResult, observationsResult] = await Promise.all([
    admin
      .from('care_needs')
      .select('*')
      .eq('user_id', userId)
      .eq('id', careNeedId)
      .maybeSingle<CareNeedRow>(),
    admin.from('providers').select('*').eq('user_id', userId).returns<ProviderRow[]>(),
    admin
      .from('capacity_observations')
      .select('*')
      .eq('user_id', userId)
      .eq('care_need_id', careNeedId)
      .order('observed_at', { ascending: true })
      .returns<CapacityObservationRow[]>(),
  ]);

  if (careNeedResult.error) return c.json({ error: careNeedResult.error.message }, 500);
  if (!careNeedResult.data) return c.json({ error: 'not found' }, 404);
  if (providersResult.error) return c.json({ error: providersResult.error.message }, 500);
  if (observationsResult.error) return c.json({ error: observationsResult.error.message }, 500);

  const careNeed = mapCareNeedRow(careNeedResult.data);
  const now = new Date();

  const entries: RadarEntry[] = providersResult.data.map((providerRow) => {
    const provider = mapProviderRow(providerRow);
    const history = observationsResult.data
      .filter((o) => o.provider_id === providerRow.id)
      .map(mapObservationRow);
    const latest = history.length ? history[history.length - 1] : null;

    return {
      provider,
      careNeed,
      latest,
      freshness: latest ? computeFreshness(latest, now) : 'FRESH',
      history,
      recheckAllowed: !provider.doNotContact && (!latest || needsRecheck(latest, now)),
    };
  });

  return c.json({ careNeed, entries });
});

export { radar };
