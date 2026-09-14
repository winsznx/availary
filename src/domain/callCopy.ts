import type { CallExecutionState, CareNeed } from './types';
import { formatAgeAtStart, formatDate, formatScheduleMode, formatWeekdays } from './format';

/** Exactly what Availary may share and ask during an availability call (PRD §7). */
export function sharedCareFacts(careNeed: CareNeed): string[] {
  return [
    `Child age at start: ${formatAgeAtStart(careNeed.ageAtStartMonths)}`,
    `Desired start: ${formatDate(careNeed.desiredStartDate)}`,
    `Weekdays needed: ${formatWeekdays(careNeed.weekdays)}`,
    `Care type: ${formatScheduleMode(careNeed.scheduleMode)}`,
  ];
}

export const QUESTION_CATEGORIES = [
  'Current availability for this age group',
  'Whether the weekdays we need are covered',
  'Any expected opening and roughly when',
  'Whether there is a waitlist and how it works',
  'Whether a visit or tour is possible',
];

/** Never shared. Shown explicitly so the call boundary is obvious. */
export const NOT_SHARED = [
  'Child name',
  'Contact details',
  'Exact birth date',
  'Home address',
  'Health or medical data',
  'Financial information',
];

export const PROGRESS_SEQUENCE: CallExecutionState[] = [
  'CREATING',
  'QUEUED',
  'CALLING',
  'PROCESSING',
];

export const TERMINAL_STATES: ReadonlySet<CallExecutionState> = new Set([
  'COMPLETED',
  'UNREACHED',
  'NO_USEFUL_ANSWER',
  'REFUSED',
  'UNSUPPORTED',
  'FAILED',
  'AMBIGUOUS',
  'RECONCILE_REQUIRED',
  'CANCELED',
]);

export function isTerminal(state: CallExecutionState): boolean {
  return TERMINAL_STATES.has(state);
}

export interface CallStateCopy {
  label: string;
  /** Whether a real call may already have happened by this state. */
  sideEffect: 'none' | 'possible' | 'unknown';
  detail: string;
}

/**
 * Plain-language copy for every call state. `UNKNOWN`/ambiguity never reads as
 * `UNAVAILABLE`, and no state optimistically claims an opening (PRD §13).
 */
export const CALL_STATE_COPY: Record<CallExecutionState, CallStateCopy> = {
  PREVIEW: {
    label: 'Review call',
    sideEffect: 'none',
    detail: 'Nothing has been sent yet. This is a preview of exactly what will be asked.',
  },
  APPROVED: {
    label: 'Approved, starting',
    sideEffect: 'none',
    detail: 'Approved. The call has not started yet.',
  },
  CREATING: {
    label: 'Preparing',
    sideEffect: 'possible',
    detail: 'Preparing one call with Availary. This is the last moment before it may start.',
  },
  QUEUED: {
    label: 'Queued',
    sideEffect: 'possible',
    detail: 'Queued to place one call. Availary will not place a second call.',
  },
  CALLING: {
    label: 'Calling',
    sideEffect: 'possible',
    detail: 'A single call is in progress now.',
  },
  PROCESSING: {
    label: 'Processing answer',
    sideEffect: 'possible',
    detail: 'The call finished; checking whether the answer meets the evidence bar.',
  },
  COMPLETED: {
    label: 'Observation ready',
    sideEffect: 'possible',
    detail: 'A validated observation was recorded on the provider timeline.',
  },
  UNREACHED: {
    label: 'Unreached',
    sideEffect: 'possible',
    detail: 'No one answered. Nothing about availability was established.',
  },
  NO_USEFUL_ANSWER: {
    label: 'No useful answer',
    sideEffect: 'possible',
    detail: 'Someone answered but no usable availability answer was established.',
  },
  REFUSED: {
    label: 'Refused',
    sideEffect: 'possible',
    detail: 'The provider declined to answer. That is not the same as no availability.',
  },
  UNSUPPORTED: {
    label: 'Unsupported',
    sideEffect: 'none',
    detail: 'This number or region is not supported, so no call was placed.',
  },
  FAILED: {
    label: 'Call failed',
    sideEffect: 'possible',
    detail: 'The call could not be completed. Availability was not established.',
  },
  AMBIGUOUS: {
    label: 'Could not establish an answer',
    sideEffect: 'possible',
    detail: 'The result was unclear, so availability stays unknown. Availary will not guess.',
  },
  RECONCILE_REQUIRED: {
    label: 'Reconciliation required',
    sideEffect: 'possible',
    detail:
      'The outcome could not be confirmed. Availary will reconcile the same call. It never dials again.',
  },
  CANCELED: {
    label: 'Cancelled',
    sideEffect: 'none',
    detail: 'This call was cancelled before it was placed.',
  },
};
