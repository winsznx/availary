import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../middleware/auth';
import { createSupabaseAdmin } from '../db/client';
import { mapCareNeedRow, mapProviderRow, scheduleModeToRow } from '../db/mappers';
import { encryptPhone, last4 } from '../db/phone-crypto';
import type { CareNeedRow, ProviderRow } from '../../shared/types';

const careNeeds = new Hono<AppEnv>();

const careNeedInputSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
  ageAtStartMonths: z.number().int().min(0).max(180),
  desiredStartDate: z.string(),
  flexibilityDays: z.number().int().min(0).max(90),
  weekdays: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])),
  scheduleMode: z.enum(['FULL_TIME', 'PART_TIME', 'FLEXIBLE']),
  locationLabel: z.string().optional(),
});

careNeeds.get('/active', async (c) => {
  const admin = createSupabaseAdmin(c.env);
  const { data, error } = await admin
    .from('care_needs')
    .select('*')
    .eq('user_id', c.var.userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<CareNeedRow>();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ? mapCareNeedRow(data) : null);
});

careNeeds.get('/', async (c) => {
  const admin = createSupabaseAdmin(c.env);
  const { data, error } = await admin
    .from('care_needs')
    .select('*')
    .eq('user_id', c.var.userId)
    .order('created_at', { ascending: false })
    .returns<CareNeedRow[]>();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data.map(mapCareNeedRow));
});

careNeeds.get('/:id', async (c) => {
  const admin = createSupabaseAdmin(c.env);
  const { data, error } = await admin
    .from('care_needs')
    .select('*')
    .eq('user_id', c.var.userId)
    .eq('id', c.req.param('id'))
    .maybeSingle<CareNeedRow>();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ? mapCareNeedRow(data) : null);
});

careNeeds.post('/', async (c) => {
  const parsed = careNeedInputSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

  const admin = createSupabaseAdmin(c.env);
  const { data, error } = await admin
    .from('care_needs')
    .insert({
      user_id: c.var.userId,
      label: parsed.data.label,
      age_at_start_months: parsed.data.ageAtStartMonths,
      desired_start_date: parsed.data.desiredStartDate,
      flexibility_days: parsed.data.flexibilityDays,
      weekdays: parsed.data.weekdays,
      schedule_mode: scheduleModeToRow(parsed.data.scheduleMode),
      location_label: parsed.data.locationLabel ?? null,
    })
    .select('*')
    .single<CareNeedRow>();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(mapCareNeedRow(data), 201);
});

const draftProviderSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1),
  phone: z.string().min(1),
  region: z.string().min(1),
  locale: z.string().min(1),
  consentBasis: z.enum(['owned_test_number', 'explicit_provider_consent', 'production_legal_basis']),
});

const syncDraftSchema = z.object({
  careNeed: careNeedInputSchema.extend({ id: z.string().uuid() }),
  providers: z.array(draftProviderSchema),
});

/**
 * Idempotent sync of the pre-auth local draft (`src/services/localDraft.ts`)
 * into the real backend. The client-generated UUIDs in the draft become the
 * real primary keys, so nothing already navigated to in the browser (a
 * `/providers/:id` or `/radar/:careNeedId` URL) needs to change. Re-posting
 * the same draft (a retry, a page refresh mid-handoff) upserts the same
 * rows rather than duplicating them — the id itself is the idempotency key.
 */
careNeeds.post('/sync-draft', async (c) => {
  const parsed = syncDraftSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

  const admin = createSupabaseAdmin(c.env);
  const userId = c.var.userId;
  const { careNeed, providers } = parsed.data;

  // Ownership check: if this id already exists, it must already be ours.
  const { data: existingNeed } = await admin
    .from('care_needs')
    .select('user_id')
    .eq('id', careNeed.id)
    .maybeSingle<{ user_id: string }>();
  if (existingNeed && existingNeed.user_id !== userId) {
    return c.json({ error: 'conflict' }, 409);
  }

  const { data: careNeedRow, error: careNeedError } = await admin
    .from('care_needs')
    .upsert({
      id: careNeed.id,
      user_id: userId,
      label: careNeed.label,
      age_at_start_months: careNeed.ageAtStartMonths,
      desired_start_date: careNeed.desiredStartDate,
      flexibility_days: careNeed.flexibilityDays,
      weekdays: careNeed.weekdays,
      schedule_mode: scheduleModeToRow(careNeed.scheduleMode),
      location_label: careNeed.locationLabel ?? null,
    })
    .select('*')
    .single<CareNeedRow>();
  if (careNeedError) return c.json({ error: careNeedError.message }, 500);

  const providerRows: ProviderRow[] = [];
  for (const provider of providers) {
    const { data: existingProvider } = await admin
      .from('providers')
      .select('user_id')
      .eq('id', provider.id)
      .maybeSingle<{ user_id: string }>();
    if (existingProvider && existingProvider.user_id !== userId) {
      return c.json({ error: 'conflict' }, 409);
    }

    const phoneCiphertext = await encryptPhone(provider.phone, c.env.PHONE_ENCRYPTION_KEY);
    const { data, error } = await admin
      .from('providers')
      .upsert({
        id: provider.id,
        user_id: userId,
        display_name: provider.displayName,
        phone_ciphertext: phoneCiphertext,
        phone_last4: last4(provider.phone),
        region: provider.region,
        locale: provider.locale,
        consent_basis: provider.consentBasis,
      })
      .select('*')
      .single<ProviderRow>();
    if (error) return c.json({ error: error.message }, 500);
    providerRows.push(data);
  }

  return c.json({
    careNeed: mapCareNeedRow(careNeedRow),
    providers: providerRows.map(mapProviderRow),
  });
});

export { careNeeds };
