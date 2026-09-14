import type { CapacityObservation } from './types';

/**
 * Fixed timeline window for the demo Radar axis. A real implementation will
 * derive this from the CareNeed and observation range.
 */
export const TIMELINE_START_ISO = '2026-09-01T00:00:00Z';
export const TIMELINE_END_ISO = '2026-12-31T00:00:00Z';

export interface TimelineTick {
  iso: string;
  label: string;
}

export const TIMELINE_TICKS: TimelineTick[] = [
  { iso: '2026-09-01T00:00:00Z', label: 'Sep' },
  { iso: '2026-10-01T00:00:00Z', label: 'Oct' },
  { iso: '2026-11-01T00:00:00Z', label: 'Nov' },
  { iso: '2026-12-01T00:00:00Z', label: 'Dec' },
];

const start = () => new Date(TIMELINE_START_ISO).getTime();
const end = () => new Date(TIMELINE_END_ISO).getTime();

/** Percentage position of a date along the shared axis, clamped to 0..100. */
export function timelinePercent(iso: string): number {
  const t = new Date(iso).getTime();
  const raw = ((t - start()) / (end() - start())) * 100;
  return Math.min(100, Math.max(0, raw));
}

export interface OpeningWindow {
  leftPercent: number;
  widthPercent: number;
  text: string;
}

/**
 * The expected-opening window is a real span in time, from the desired start
 * date across the CareNeed's flexibility, not a point badge.
 */
export function openingWindow(
  observation: CapacityObservation,
  desiredStartDate: string,
  flexibilityDays: number,
): OpeningWindow | null {
  if (observation.state !== 'EXPECTED_OPENING') return null;
  const left = timelinePercent(desiredStartDate);
  const until = new Date(desiredStartDate);
  until.setDate(until.getDate() + Math.max(flexibilityDays, 1));
  const right = timelinePercent(until.toISOString());
  return {
    leftPercent: left,
    widthPercent: Math.max(right - left, 4),
    text: observation.earliestOpeningText || 'Expected opening',
  };
}
