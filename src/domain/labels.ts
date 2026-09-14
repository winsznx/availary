import type {
  AvailabilityState,
  FreshnessState,
  ScheduleFit,
  TriState,
  UiAvailabilityState,
  Weekday,
} from './types';

/**
 * Plain-language labels. Internal enum names must never reach the user UI
 * (PRD §13; design.md §4.2). Every state carries a written label so meaning is
 * never encoded by colour alone.
 */
export const STATE_LABEL: Record<UiAvailabilityState, string> = {
  OPEN_NOW: 'Open now',
  EXPECTED_OPENING: 'Expected opening',
  PARTIAL_FIT: 'Partial fit',
  WAITLIST_ONLY: 'Waitlist only',
  NO_FIT: 'No fit',
  NO_KNOWN_OPENING: 'No known opening',
  UNKNOWN: 'Unknown',
  REFUSED: 'Refused',
  UNREACHED: 'Unreached',
  NOT_CHECKED: 'Not checked',
};

export const FRESHNESS_LABEL: Record<FreshnessState, string> = {
  FRESH: 'Fresh',
  // Reserved: only a backend contract may report AGING (boundaries undefined).
  AGING: 'Aging',
  STALE: 'Stale',
};

/** Shown when an observation is past its freshness window and should be rechecked. */
export const NEEDS_RECHECK_LABEL = 'Needs recheck';

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export const TRI_STATE_LABEL: Record<TriState, string> = {
  yes: 'Yes',
  no: 'No',
  unknown: 'Not established',
};

export const SCHEDULE_FIT_LABEL: Record<ScheduleFit, string> = {
  full: 'Full schedule fit',
  partial: 'Partial schedule fit',
  none: 'No schedule fit',
  unknown: 'Schedule fit not established',
};

export function isPositiveState(state: AvailabilityState): boolean {
  return state === 'OPEN_NOW' || state === 'EXPECTED_OPENING';
}
