import type {
  CapacityObservation,
  CareNeed,
  EvidenceItem,
  Provider,
  ScheduleFit,
  ScheduleMode,
  TriState,
} from '../../domain/types';
import type {
  CapacityObservationRow,
  CareNeedRow,
  EvidenceQualityRow,
  ObservationEvidenceRow,
  ProviderRow,
  ScheduleFitRow,
  ScheduleModeRow,
} from '../../shared/types';

const SCHEDULE_MODE_TO_DOMAIN: Record<ScheduleModeRow, ScheduleMode> = {
  full_time: 'FULL_TIME',
  part_time: 'PART_TIME',
  flexible: 'FLEXIBLE',
};

const SCHEDULE_MODE_TO_ROW: Record<ScheduleMode, ScheduleModeRow> = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  FLEXIBLE: 'flexible',
};

// The DB draft (internal/db/schema.sql) uses 'no'; the frontend domain
// contract (src/domain/types.ts) uses 'none' for the same concept.
const SCHEDULE_FIT_TO_DOMAIN: Record<ScheduleFitRow, ScheduleFit> = {
  full: 'full',
  partial: 'partial',
  no: 'none',
  unknown: 'unknown',
};

const SCHEDULE_FIT_TO_ROW: Record<ScheduleFit, ScheduleFitRow> = {
  full: 'full',
  partial: 'partial',
  none: 'no',
  unknown: 'unknown',
};

// The DB draft stores a coarse enum; the domain contract wants a 0..1
// confidence score. This mapping is presentational only — the underlying
// promotion decision already happened server-side in classify.ts.
const EVIDENCE_QUALITY_TO_SCORE: Record<EvidenceQualityRow, number> = {
  strong: 0.9,
  partial: 0.6,
  insufficient: 0.3,
};

export function scheduleModeToRow(mode: ScheduleMode): ScheduleModeRow {
  return SCHEDULE_MODE_TO_ROW[mode];
}

export function scheduleFitToRow(fit: ScheduleFit): ScheduleFitRow {
  return SCHEDULE_FIT_TO_ROW[fit];
}

export function mapCareNeedRow(row: CareNeedRow): CareNeed {
  return {
    id: row.id,
    label: row.label,
    ageAtStartMonths: row.age_at_start_months,
    desiredStartDate: row.desired_start_date,
    flexibilityDays: row.flexibility_days,
    weekdays: row.weekdays,
    scheduleMode: SCHEDULE_MODE_TO_DOMAIN[row.schedule_mode],
    locationLabel: row.location_label ?? undefined,
    createdAt: row.created_at,
  };
}

/** `last4` is presentational only — the full E.164 number never leaves the Worker. */
export function maskFromLast4(last4: string): string {
  return `+· · · · · · ${last4}`;
}

export function mapProviderRow(row: ProviderRow): Provider {
  return {
    id: row.id,
    displayName: row.display_name,
    maskedPhone: maskFromLast4(row.phone_last4),
    region: row.region,
    locale: row.locale,
    consentBasis: row.consent_basis,
    doNotContact: row.do_not_contact_at !== null,
    createdAt: row.created_at,
  };
}

const TRI_STATE_ROW = new Set<TriState>(['yes', 'no', 'unknown']);
function asTriState(value: string): TriState {
  return TRI_STATE_ROW.has(value as TriState) ? (value as TriState) : 'unknown';
}

export function mapObservationRow(row: CapacityObservationRow): CapacityObservation {
  return {
    id: row.id,
    providerId: row.provider_id,
    careNeedId: row.care_need_id,
    state: row.state,
    ageBandFit: asTriState(row.age_band_fit),
    scheduleFit: SCHEDULE_FIT_TO_DOMAIN[row.schedule_fit],
    fullTimeFit: asTriState(row.full_time_fit),
    waitlistOpen: asTriState(row.waitlist_open),
    tourAvailable: asTriState(row.tour_available),
    weekdaysAvailable: row.days_available,
    earliestOpeningText: row.earliest_opening_text,
    evidenceQuality: EVIDENCE_QUALITY_TO_SCORE[row.evidence_quality],
    promotable: row.promotable,
    observedAt: row.observed_at,
    freshUntil: row.fresh_until,
    supersedesObservationId: row.supersedes_observation_id ?? undefined,
  };
}

export function mapEvidenceRow(row: ObservationEvidenceRow): EvidenceItem {
  return {
    id: row.id,
    observationId: row.observation_id,
    fieldName: row.field_name,
    quote: row.quote,
    source: 'phone_call',
    verifiedInTranscript: row.verified_in_transcript,
    observedAt: row.created_at,
  };
}
