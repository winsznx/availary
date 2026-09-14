import { z } from 'zod';

/**
 * Mirrors `internal/schemas/calle-recipient-result.schema.json` exactly —
 * same required fields, same enums. Validates every CALL-E extracted result
 * before it can touch the database. A response that fails this schema is
 * treated as UNKNOWN, never guessed at.
 */
export const calleRecipientResultSchema = z
  .object({
    willing_to_answer: z.enum(['yes', 'no', 'unknown']),
    availability_state: z.enum([
      'open_now',
      'expected_future',
      'waitlist_only',
      'no_known_opening',
      'unknown',
    ]),
    age_band_fit: z.enum(['yes', 'no', 'unknown']),
    schedule_fit: z.enum(['full', 'partial', 'no', 'unknown']),
    full_time_fit: z.enum(['yes', 'no', 'unknown']),
    waitlist_open: z.enum(['yes', 'no', 'unknown']),
    tour_available: z.enum(['yes', 'no', 'unknown']),
    opening_window_text: z.string(),
    days_available: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])),
    availability_evidence: z.string(),
    age_band_evidence: z.string(),
    schedule_evidence: z.string(),
    waitlist_evidence: z.string(),
    tour_evidence: z.string(),
    provider_notes: z.string(),
  })
  .strict();

export type CalleRecipientResult = z.infer<typeof calleRecipientResultSchema>;

/**
 * The plain JSON Schema sent as `recipient_result_schema` in the create-call
 * request body. Kept byte-for-byte in sync with
 * `internal/schemas/calle-recipient-result.schema.json` — that file is the
 * canonical source; this constant is the copy the Worker can bundle without
 * reading outside `src/`. Do not add unsupported JSON Schema constructs.
 */
export const CALLE_RECIPIENT_RESULT_JSON_SCHEMA = {
  type: 'object',
  required: [
    'willing_to_answer',
    'availability_state',
    'age_band_fit',
    'schedule_fit',
    'full_time_fit',
    'waitlist_open',
    'tour_available',
    'opening_window_text',
    'days_available',
    'availability_evidence',
    'age_band_evidence',
    'schedule_evidence',
    'waitlist_evidence',
    'tour_evidence',
    'provider_notes',
  ],
  properties: {
    willing_to_answer: { type: 'string', enum: ['yes', 'no', 'unknown'] },
    availability_state: {
      type: 'string',
      enum: ['open_now', 'expected_future', 'waitlist_only', 'no_known_opening', 'unknown'],
    },
    age_band_fit: { type: 'string', enum: ['yes', 'no', 'unknown'] },
    schedule_fit: { type: 'string', enum: ['full', 'partial', 'no', 'unknown'] },
    full_time_fit: { type: 'string', enum: ['yes', 'no', 'unknown'] },
    waitlist_open: { type: 'string', enum: ['yes', 'no', 'unknown'] },
    tour_available: { type: 'string', enum: ['yes', 'no', 'unknown'] },
    opening_window_text: { type: 'string' },
    days_available: {
      type: 'array',
      items: { type: 'string', enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
    },
    availability_evidence: { type: 'string' },
    age_band_evidence: { type: 'string' },
    schedule_evidence: { type: 'string' },
    waitlist_evidence: { type: 'string' },
    tour_evidence: { type: 'string' },
    provider_notes: { type: 'string' },
  },
  additionalProperties: false,
} as const;

const transcriptTurnSchema = z.object({
  speaker: z.enum(['user', 'agent']),
  text: z.string(),
  offset_seconds: z.number().optional(),
});

/**
 * The subset of the `GET /v1/calls/{id}` response this app depends on. Other
 * fields the Developer API returns are ignored, not modeled — do not widen
 * this without checking the live docs first (TECHNICAL-SPEC.md documentation rule).
 */
export const calleCallStatusSchema = z.object({
  call_id: z.string(),
  status: z.enum([
    'queued',
    'in_progress',
    'completed',
    'failed',
    'canceled',
    'no_answer',
    'refused',
  ]),
  failure_code: z.string().nullable().optional(),
  failure_message: z.string().nullable().optional(),
  task_completed: z.boolean().nullable().optional(),
  confidence_score: z.number().nullable().optional(),
  confidence_label: z.string().nullable().optional(),
  extracted_result: calleRecipientResultSchema.nullable().optional(),
  transcript: z.array(transcriptTurnSchema).nullable().optional(),
});

export type CalleCallStatus = z.infer<typeof calleCallStatusSchema>;

export const calleCreateResponseSchema = z.object({
  call_id: z.string(),
  status: z.string(),
});

export type CalleCreateResponse = z.infer<typeof calleCreateResponseSchema>;
