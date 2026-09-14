import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../middleware/auth';
import { createSupabaseAdmin } from '../db/client';
import { mapObservationRow, mapProviderRow } from '../db/mappers';
import { encryptPhone, last4 } from '../db/phone-crypto';
import type { CapacityObservationRow, ProviderRow } from '../../shared/types';

const providers = new Hono<AppEnv>();

providers.get('/', async (c) => {
  const admin = createSupabaseAdmin(c.env);
  const { data, error } = await admin
    .from('providers')
    .select('*')
    .eq('user_id', c.var.userId)
    .order('created_at', { ascending: false })
    .returns<ProviderRow[]>();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data.map(mapProviderRow));
});

providers.get('/:id', async (c) => {
  const admin = createSupabaseAdmin(c.env);
  const { data, error } = await admin
    .from('providers')
    .select('*')
    .eq('user_id', c.var.userId)
    .eq('id', c.req.param('id'))
    .maybeSingle<ProviderRow>();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ? mapProviderRow(data) : null);
});

const newProviderSchema = z.object({
  displayName: z.string().min(1),
  phone: z.string().min(1),
  region: z.string().min(1),
  locale: z.string().min(1),
  consentBasis: z.enum(['owned_test_number', 'explicit_provider_consent', 'production_legal_basis']),
});

providers.post('/', async (c) => {
  const parsed = newProviderSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

  const admin = createSupabaseAdmin(c.env);
  const phoneCiphertext = await encryptPhone(parsed.data.phone, c.env.PHONE_ENCRYPTION_KEY);

  const { data, error } = await admin
    .from('providers')
    .insert({
      user_id: c.var.userId,
      display_name: parsed.data.displayName,
      phone_ciphertext: phoneCiphertext,
      phone_last4: last4(parsed.data.phone),
      region: parsed.data.region,
      locale: parsed.data.locale,
      consent_basis: parsed.data.consentBasis,
    })
    .select('*')
    .single<ProviderRow>();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(mapProviderRow(data), 201);
});

const doNotContactSchema = z.object({ value: z.boolean() });

providers.post('/:id/do-not-contact', async (c) => {
  const parsed = doNotContactSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

  const admin = createSupabaseAdmin(c.env);
  const { data, error } = await admin
    .from('providers')
    .update({ do_not_contact_at: parsed.data.value ? new Date().toISOString() : null })
    .eq('user_id', c.var.userId)
    .eq('id', c.req.param('id'))
    .select('*')
    .single<ProviderRow>();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(mapProviderRow(data));
});

providers.get('/:id/history', async (c) => {
  const careNeedId = c.req.query('careNeedId');
  if (!careNeedId) return c.json({ error: 'careNeedId is required' }, 400);

  const admin = createSupabaseAdmin(c.env);
  const { data, error } = await admin
    .from('capacity_observations')
    .select('*')
    .eq('user_id', c.var.userId)
    .eq('provider_id', c.req.param('id'))
    .eq('care_need_id', careNeedId)
    .order('observed_at', { ascending: true })
    .returns<CapacityObservationRow[]>();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data.map(mapObservationRow));
});

export { providers };
