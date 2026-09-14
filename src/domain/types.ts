/**
 * Availary frontend domain contracts.
 *
 * Derived from product truth (PRD.md §6, §13) — not from any backend wire format.
 * UI components must consume these types, never raw CALL-E/backend JSON.
 * The service adapter (src/services) is responsible for mapping remote data here.
 */

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type ScheduleMode = 'FULL_TIME' | 'PART_TIME' | 'FLEXIBLE';

/** Lives on the CareNeed; never a child name, birth date, address or health data. */
export interface CareNeed {
  id: string;
  label: string;
  ageAtStartMonths: number;
  /** ISO date (yyyy-mm-dd) of the desired start. */
  desiredStartDate: string;
  flexibilityDays: number;
  weekdays: Weekday[];
  scheduleMode: ScheduleMode;
  locationLabel?: string;
  createdAt: string;
}

export type ConsentBasis =
  | 'owned_test_number'
  | 'explicit_provider_consent'
  | 'production_legal_basis';

export interface Provider {
  id: string;
  displayName: string;
  /** Stored E.164 server-side; the frontend only ever shows a masked form. */
  maskedPhone: string;
  region: string;
  locale: string;
  consentBasis: ConsentBasis;
  doNotContact: boolean;
  createdAt: string;
}

/**
 * Availability truth. `UNKNOWN` is never `UNAVAILABLE`; `NO_KNOWN_OPENING` and
 * `NO_FIT` are distinct statements. Only validated observations may set these.
 */
export type AvailabilityState =
  | 'OPEN_NOW'
  | 'EXPECTED_OPENING'
  | 'PARTIAL_FIT'
  | 'WAITLIST_ONLY'
  | 'NO_FIT'
  | 'NO_KNOWN_OPENING'
  | 'UNKNOWN'
  | 'REFUSED'
  | 'UNREACHED';

/** UI-only presentation state — never persisted, never sent to a backend. */
export type UiAvailabilityState = AvailabilityState | 'NOT_CHECKED';

/**
 * Freshness is derived from `freshUntil` only. `AGING` is reserved for a
 * backend/product contract to supply; the frontend never derives it, because
 * the Aging/Stale boundaries are undefined in product truth.
 */
export type FreshnessState = 'FRESH' | 'AGING' | 'STALE';

export type TriState = 'yes' | 'no' | 'unknown';
export type ScheduleFit = 'full' | 'partial' | 'none' | 'unknown';

/** A single timestamped availability observation. Observations are append-only. */
export interface CapacityObservation {
  id: string;
  providerId: string;
  careNeedId: string;
  state: AvailabilityState;
  ageBandFit: TriState;
  scheduleFit: ScheduleFit;
  fullTimeFit: TriState;
  waitlistOpen: TriState;
  tourAvailable: TriState;
  weekdaysAvailable: Weekday[];
  /** Human-readable opening window, e.g. "early November". Empty when none. */
  earliestOpeningText: string;
  /** 0..1 confidence in the extracted facts. */
  evidenceQuality: number;
  promotable: boolean;
  observedAt: string;
  /** ISO timestamp after which the observation should be treated as stale. */
  freshUntil: string;
  supersedesObservationId?: string;
}

export type EvidenceSource = 'phone_call';

/** Provenance for a single supported claim. Concise — never a raw transcript. */
export interface EvidenceItem {
  id: string;
  observationId: string;
  fieldName: string;
  quote: string;
  source: EvidenceSource;
  verifiedInTranscript: boolean;
  observedAt: string;
}

export interface ObservationTransition {
  from: AvailabilityState | null;
  to: AvailabilityState;
  at: string;
  observationId: string;
}

/** Local call lifecycle. Mirrors the PRD/TECHNICAL-SPEC state names. */
export type CallExecutionState =
  | 'PREVIEW'
  | 'APPROVED'
  | 'CREATING'
  | 'QUEUED'
  | 'CALLING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'UNREACHED'
  | 'NO_USEFUL_ANSWER'
  | 'REFUSED'
  | 'UNSUPPORTED'
  | 'FAILED'
  | 'AMBIGUOUS'
  | 'RECONCILE_REQUIRED'
  | 'CANCELED';

export interface CallIntent {
  id: string;
  providerId: string;
  careNeedId: string;
  requestHash: string;
  idempotencyKey: string;
  createdAt: string;
}

/** The side-effect-free preview state, addressed by the call route. */
export interface CallPreview {
  id: string;
  providerId: string;
  careNeedId: string;
  state: CallExecutionState;
  createdAt: string;
}

/** Everything the call route needs to render preview, progress and outcome. */
export interface CallRunView extends CallPreview {
  provider: Provider;
  careNeed: CareNeed;
  updatedAt: string;
  /** True once a real call may have been placed; no second call, no redial. */
  placed: boolean;
  observationId?: string;
}

export interface CallRun {
  id: string;
  intentId: string;
  providerId: string;
  careNeedId: string;
  state: CallExecutionState;
  createdAt: string;
  updatedAt: string;
  observationId?: string;
}

/** What a Radar row needs to render one provider against one CareNeed. */
export interface RadarEntry {
  provider: Provider;
  careNeed: CareNeed;
  latest: CapacityObservation | null;
  freshness: FreshnessState;
  history: CapacityObservation[];
  recheckAllowed: boolean;
}

export interface Radar {
  careNeed: CareNeed;
  entries: RadarEntry[];
}
