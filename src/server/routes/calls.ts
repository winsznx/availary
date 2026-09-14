import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../middleware/auth';
import { createSupabaseAdmin } from '../db/client';
import { mapCareNeedRow, mapProviderRow } from '../db/mappers';
import { decryptPhone } from '../db/phone-crypto';
import { createCalleClient, CalleRequestError } from '../calle/client';
import { compileCallTask } from '../calle/task-compiler';
import { classifyCreateFailure, isTerminalRunStatus, mapCalleStatusToRunStatus } from '../calle/reconcile';
import { classifyObservation, nullResultClassification } from '../observations/classify';
import { evidenceVerifiedInTranscript } from '../observations/validate-evidence';
import { computeFreshUntil } from '../observations/freshness';
import {
  buildIdempotencyKey,
  CALL_INTENT_EXPIRY_MS,
  CALLE_POLL_THROTTLE_MS,
  isAllowlistedNumber,
} from '../../shared/constants';
import { isRateLimited } from '../middleware/rate-limit';
import type {
  CallIntentRow,
  CallRunRow,
  CallRunStatus,
  CapacityObservationRow,
  CareNeedRow,
  ProviderRow,
  WorkerEnv,
} from '../../shared/types';
import type { CallExecutionState } from '../../domain/types';

const calls = new Hono<AppEnv>();

const lastPolledAt = new Map<string, number>();

async function loadRunContext(admin: ReturnType<typeof createSupabaseAdmin>, userId: string, callRunId: string) {
  const { data: run, error: runError } = await admin
    .from('call_runs')
    .select('*')
    .eq('user_id', userId)
    .eq('id', callRunId)
    .maybeSingle<CallRunRow>();
  if (runError || !run) return null;

  const { data: intent, error: intentError } = await admin
    .from('call_intents')
    .select('*')
    .eq('id', run.call_intent_id)
    .maybeSingle<CallIntentRow>();
  if (intentError || !intent) return null;

  const [{ data: provider }, { data: careNeed }] = await Promise.all([
    admin.from('providers').select('*').eq('id', intent.provider_id).maybeSingle<ProviderRow>(),
    admin.from('care_needs').select('*').eq('id', intent.care_need_id).maybeSingle<CareNeedRow>(),
  ]);
  if (!provider || !careNeed) return null;

  return { run, intent, provider, careNeed };
}

function mapRunToExecutionState(run: CallRunRow, observationState?: string): CallExecutionState {
  switch (run.status) {
    case 'PREVIEW':
      return 'PREVIEW';
    case 'CREATING':
      return 'CREATING';
    case 'QUEUED':
      return 'QUEUED';
    case 'IN_PROGRESS':
      return 'CALLING';
    case 'CANCELED':
      return 'CANCELED';
    case 'RECONCILE_REQUIRED':
      return 'RECONCILE_REQUIRED';
    case 'COMPLETED':
      if (observationState === 'REFUSED') return 'REFUSED';
      if (observationState === 'UNKNOWN' || !observationState) return 'NO_USEFUL_ANSWER';
      return 'COMPLETED';
    case 'FAILED':
      if (run.raw_failure_code === 'no_answer') return 'UNREACHED';
      if (run.raw_failure_code === 'unsupported') return 'UNSUPPORTED';
      return 'FAILED';
    default:
      return 'RECONCILE_REQUIRED';
  }
}

async function toRunView(
  admin: ReturnType<typeof createSupabaseAdmin>,
  ctx: NonNullable<Awaited<ReturnType<typeof loadRunContext>>>,
) {
  let observationState: string | undefined;
  let observationId: string | undefined;
  if (ctx.run.status === 'COMPLETED') {
    const { data } = await admin
      .from('capacity_observations')
      .select('id, state')
      .eq('call_run_id', ctx.run.id)
      .maybeSingle<{ id: string; state: string }>();
    observationState = data?.state;
    observationId = data?.id;
  }

  return {
    id: ctx.run.id,
    providerId: ctx.intent.provider_id,
    careNeedId: ctx.intent.care_need_id,
    state: mapRunToExecutionState(ctx.run, observationState),
    createdAt: ctx.run.created_at,
    updatedAt: ctx.run.finalized_at ?? ctx.run.submitted_at ?? ctx.run.created_at,
    placed: ctx.intent.approved_at !== null,
    observationId,
    provider: mapProviderRow(ctx.provider),
    careNeed: mapCareNeedRow(ctx.careNeed),
  };
}

/**
 * Polls the remote CALL-E status (throttled) and, on a terminal `completed`
 * result, runs the full evidence → classification → persistence pipeline
 * exactly once. Never dials again from here — this only ever reads.
 */
async function reconcileRun(
  admin: ReturnType<typeof createSupabaseAdmin>,
  env: WorkerEnv,
  ctx: NonNullable<Awaited<ReturnType<typeof loadRunContext>>>,
) {
  if (isTerminalRunStatus(ctx.run.status) || !ctx.run.calle_call_id) return ctx;

  const last = lastPolledAt.get(ctx.run.id) ?? 0;
  if (Date.now() - last < CALLE_POLL_THROTTLE_MS) return ctx;
  lastPolledAt.set(ctx.run.id, Date.now());

  const client = createCalleClient({ apiKey: env.CALLE_API_KEY, baseUrl: env.CALLE_BASE_URL });
  const remote = await client.getCall(ctx.run.calle_call_id);
  const nextStatus: CallRunStatus = mapCalleStatusToRunStatus(remote.status);

  if (nextStatus === 'COMPLETED') {
    const transcript = remote.transcript ?? [];
    const result = remote.extracted_result;

    const classification = result
      ? classifyObservation(result, transcript)
      : nullResultClassification();

    const { data: previous } = await admin
      .from('capacity_observations')
      .select('id')
      .eq('provider_id', ctx.intent.provider_id)
      .eq('care_need_id', ctx.intent.care_need_id)
      .order('observed_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    const now = new Date();
    const { data: observation, error: obsError } = await admin
      .from('capacity_observations')
      .insert({
        user_id: ctx.run.user_id,
        care_need_id: ctx.intent.care_need_id,
        provider_id: ctx.intent.provider_id,
        call_run_id: ctx.run.id,
        observed_at: now.toISOString(),
        state: classification.state,
        age_band_fit: classification.ageBandFit,
        schedule_fit: classification.scheduleFit,
        full_time_fit: classification.fullTimeFit,
        waitlist_open: classification.waitlistOpen,
        tour_available: classification.tourAvailable,
        earliest_opening_text: classification.earliestOpeningText,
        days_available: result?.days_available ?? [],
        evidence_quality: classification.evidenceQuality,
        promotable: classification.promotable,
        fresh_until: computeFreshUntil(now),
        supersedes_observation_id: previous?.id ?? null,
        extracted_result: result ?? null,
      })
      .select('*')
      .single<CapacityObservationRow>();

    if (!obsError && observation && result) {
      const evidenceFields: Array<[string, string]> = [
        ['availability_state', result.availability_evidence],
        ['age_band_fit', result.age_band_evidence],
        ['schedule_fit', result.schedule_evidence],
        ['waitlist_open', result.waitlist_evidence],
        ['tour_available', result.tour_evidence],
      ];
      const evidenceRows = evidenceFields
        .filter(([, quote]) => quote.trim().length > 0)
        .map(([fieldName, quote]) => ({
          user_id: ctx.run.user_id,
          observation_id: observation.id,
          field_name: fieldName,
          quote,
          verified_in_transcript: evidenceVerifiedInTranscript(quote, transcript),
        }));
      if (evidenceRows.length) {
        await admin.from('observation_evidence').insert(evidenceRows);
      }
    }

    await admin
      .from('call_runs')
      .update({
        status: 'COMPLETED',
        provider_task_completed: result !== null,
        provider_confidence_score: remote.confidence_score ?? null,
        provider_confidence_label: remote.confidence_label ?? null,
        completed_at: now.toISOString(),
        finalized_at: now.toISOString(),
      })
      .eq('id', ctx.run.id);
  } else if (isTerminalRunStatus(nextStatus)) {
    await admin
      .from('call_runs')
      .update({
        status: nextStatus,
        raw_failure_code: remote.status,
        failure_message: remote.failure_message ?? null,
        finalized_at: new Date().toISOString(),
      })
      .eq('id', ctx.run.id);
  } else if (nextStatus !== ctx.run.status) {
    await admin.from('call_runs').update({ status: nextStatus }).eq('id', ctx.run.id);
  }

  const refreshed = await loadRunContext(admin, ctx.run.user_id, ctx.run.id);
  return refreshed ?? ctx;
}

const previewSchema = z.object({
  providerId: z.string().uuid(),
  careNeedId: z.string().uuid(),
});

calls.post('/preview', async (c) => {
  const parsed = previewSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

  const admin = createSupabaseAdmin(c.env);
  const userId = c.var.userId;

  const [{ data: provider }, { data: careNeed }] = await Promise.all([
    admin
      .from('providers')
      .select('*')
      .eq('user_id', userId)
      .eq('id', parsed.data.providerId)
      .maybeSingle<ProviderRow>(),
    admin
      .from('care_needs')
      .select('*')
      .eq('user_id', userId)
      .eq('id', parsed.data.careNeedId)
      .maybeSingle<CareNeedRow>(),
  ]);
  if (!provider || !careNeed) return c.json({ error: 'not found' }, 404);

  // Do-not-contact blocks preview creation outright (TECHNICAL-SPEC required test case).
  if (provider.do_not_contact_at !== null) {
    return c.json({ error: 'do_not_contact' }, 403);
  }

  const callIntentId = crypto.randomUUID();
  const now = new Date();
  const idempotencyKey = buildIdempotencyKey(userId, callIntentId);
  const mode = c.env.AVAILARY_LIVE_CALLS === 'true' ? 'live' : 'fixture';

  const { error: intentError } = await admin.from('call_intents').insert({
    id: callIntentId,
    user_id: userId,
    care_need_id: careNeed.id,
    provider_id: provider.id,
    mode,
    request_hash: idempotencyKey,
    idempotency_key: idempotencyKey,
    preview_snapshot: { provider: mapProviderRow(provider), careNeed: mapCareNeedRow(careNeed) },
    request_body: {},
    expires_at: new Date(now.getTime() + CALL_INTENT_EXPIRY_MS).toISOString(),
  });
  if (intentError) return c.json({ error: intentError.message }, 500);

  const { data: run, error: runError } = await admin
    .from('call_runs')
    .insert({ user_id: userId, call_intent_id: callIntentId, status: 'PREVIEW' })
    .select('*')
    .single<CallRunRow>();
  if (runError || !run) return c.json({ error: runError?.message ?? 'failed to create run' }, 500);

  const ctx = await loadRunContext(admin, userId, run.id);
  if (!ctx) return c.json({ error: 'failed to load run' }, 500);
  return c.json(await toRunView(admin, ctx), 201);
});

calls.get('/:callRunId', async (c) => {
  const admin = createSupabaseAdmin(c.env);
  const ctx = await loadRunContext(admin, c.var.userId, c.req.param('callRunId'));
  if (!ctx) return c.json({ error: 'not found' }, 404);

  const reconciled = await reconcileRun(admin, c.env, ctx);
  return c.json(await toRunView(admin, reconciled));
});

calls.post('/:callRunId/place', async (c) => {
  const admin = createSupabaseAdmin(c.env);
  const userId = c.var.userId;
  const ctx = await loadRunContext(admin, userId, c.req.param('callRunId'));
  if (!ctx) return c.json({ error: 'not found' }, 404);

  // Idempotent: an already-approved run is never dialed a second time.
  if (ctx.intent.approved_at !== null) {
    return c.json(await toRunView(admin, ctx));
  }

  if (c.env.AVAILARY_LIVE_CALLS !== 'true') {
    return c.json({ error: 'live_calls_disabled' }, 403);
  }

  if (ctx.provider.do_not_contact_at !== null) {
    return c.json({ error: 'do_not_contact' }, 403);
  }

  if (isRateLimited(`${userId}:${ctx.provider.id}`)) {
    return c.json({ error: 'rate_limited' }, 429);
  }

  const providerPhone = await decryptPhone(ctx.provider.phone_ciphertext, c.env.PHONE_ENCRYPTION_KEY);

  // Hackathon/verification safety gate: while a non-empty allowlist is set,
  // live mode may only dial the consented test number(s) it names.
  if (!isAllowlistedNumber(providerPhone, c.env.AVAILARY_DEMO_ALLOWLIST)) {
    return c.json({ error: 'not_allowlisted' }, 403);
  }

  const now = new Date().toISOString();
  await admin.from('call_intents').update({ approved_at: now }).eq('id', ctx.intent.id);
  await admin.from('call_runs').update({ status: 'CREATING' }).eq('id', ctx.run.id);

  const task = compileCallTask({
    careNeed: mapCareNeedRow(ctx.careNeed),
    providerDisplayName: ctx.provider.display_name,
    providerPhoneE164: providerPhone,
    providerRegion: ctx.provider.region,
    providerLocale: ctx.provider.locale,
    callIntentId: ctx.intent.id,
  });

  const client = createCalleClient({ apiKey: c.env.CALLE_API_KEY, baseUrl: c.env.CALLE_BASE_URL });
  try {
    const created = await client.createCall(task, ctx.intent.idempotency_key);
    await admin
      .from('call_runs')
      .update({ status: 'QUEUED', calle_call_id: created.call_id, submitted_at: new Date().toISOString() })
      .eq('id', ctx.run.id);
  } catch (error) {
    const status = classifyCreateFailure(error);
    await admin
      .from('call_runs')
      .update({
        status,
        raw_failure_code: error instanceof CalleRequestError ? String(error.status) : 'network_error',
        failure_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', ctx.run.id);
  }

  const refreshed = await loadRunContext(admin, userId, ctx.run.id);
  if (!refreshed) return c.json({ error: 'failed to load run' }, 500);
  return c.json(await toRunView(admin, refreshed));
});

export { calls };
