/**
 * Wire/DB-shaped types shared between the Worker and any future non-React
 * consumer. Snake_case, mirrors `supabase/migrations/0001_init.sql` exactly.
 *
 * Never imported by frontend screens/components — those consume
 * `src/domain/types.ts` only. The Worker's route handlers are responsible for
 * mapping between the two shapes.
 */

/**
 * Minimal shape of the Cloudflare Workers `assets` binding this app uses.
 * Deliberately not pulling in the full `@cloudflare/workers-types` ambient
 * globals here — those redeclare `Request`/`Response`/`fetch` and conflict
 * with the frontend's DOM lib types, since both live under one `tsconfig`.
 */
export interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

export type ScheduleModeRow = 'full_time' | 'part_time' | 'flexible';
export type WeekdayRow = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type ConsentBasisRow =
  | 'owned_test_number'
  | 'explicit_provider_consent'
  | 'production_legal_basis';

export interface CareNeedRow {
  id: string;
  user_id: string;
  label: string;
  age_at_start_months: number;
  desired_start_date: string;
  flexibility_days: number;
  weekdays: WeekdayRow[];
  schedule_mode: ScheduleModeRow;
  location_label: string | null;
  created_at: string;
  archived_at: string | null;
}

export interface ProviderRow {
  id: string;
  user_id: string;
  display_name: string;
  phone_ciphertext: string;
  phone_last4: string;
  region: string;
  locale: string;
  timezone: string | null;
  consent_basis: ConsentBasisRow;
  do_not_contact_at: string | null;
  created_at: string;
}

export type CallMode = 'fixture' | 'live';

export interface CallIntentRow {
  id: string;
  user_id: string;
  care_need_id: string;
  provider_id: string;
  mode: CallMode;
  request_hash: string;
  idempotency_key: string;
  preview_snapshot: unknown;
  request_body: unknown;
  approved_at: string | null;
  expires_at: string;
  created_at: string;
}

export type CallRunStatus =
  | 'PREVIEW'
  | 'CREATING'
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELED'
  | 'RECONCILE_REQUIRED';

export interface CallRunRow {
  id: string;
  user_id: string;
  call_intent_id: string;
  calle_call_id: string | null;
  status: CallRunStatus;
  raw_failure_code: string | null;
  failure_message: string | null;
  provider_task_completed: boolean | null;
  provider_confidence_score: number | null;
  provider_confidence_label: string | null;
  provider_evidence: unknown;
  submitted_at: string | null;
  completed_at: string | null;
  finalized_at: string | null;
  created_at: string;
}

export type ObservationStateRow =
  | 'OPEN_NOW'
  | 'EXPECTED_OPENING'
  | 'PARTIAL_FIT'
  | 'WAITLIST_ONLY'
  | 'NO_FIT'
  | 'NO_KNOWN_OPENING'
  | 'UNKNOWN'
  | 'REFUSED'
  | 'UNREACHED';

export type TriStateRow = 'yes' | 'no' | 'unknown';
export type ScheduleFitRow = 'full' | 'partial' | 'no' | 'unknown';
export type EvidenceQualityRow = 'strong' | 'partial' | 'insufficient';

export interface CapacityObservationRow {
  id: string;
  user_id: string;
  care_need_id: string;
  provider_id: string;
  call_run_id: string;
  observed_at: string;
  state: ObservationStateRow;
  age_band_fit: TriStateRow;
  schedule_fit: ScheduleFitRow;
  full_time_fit: TriStateRow;
  waitlist_open: TriStateRow;
  tour_available: TriStateRow;
  earliest_opening_text: string;
  days_available: WeekdayRow[];
  evidence_quality: EvidenceQualityRow;
  promotable: boolean;
  fresh_until: string;
  supersedes_observation_id: string | null;
  extracted_result: unknown;
  created_at: string;
}

export interface ObservationEvidenceRow {
  id: string;
  user_id: string;
  observation_id: string;
  field_name: string;
  quote: string;
  transcript_offset_seconds: number | null;
  verified_in_transcript: boolean;
  created_at: string;
}

/** A single transcript turn, held transiently in-Worker and never persisted. */
export interface TranscriptTurn {
  speaker: 'user' | 'agent';
  text: string;
  offset_seconds?: number;
}

/** Bindings/env available to every Worker request. */
export interface WorkerEnv {
  ASSETS: Fetcher;
  CALLE_API_KEY: string;
  CALLE_BASE_URL: string;
  AVAILARY_LIVE_CALLS: string;
  AVAILARY_DEMO_ALLOWLIST: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PHONE_ENCRYPTION_KEY: string;
  /** Comma-separated list of allowed CORS origins (local + production). */
  APP_ORIGIN: string;
}
