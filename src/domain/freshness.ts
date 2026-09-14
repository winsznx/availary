import type { CapacityObservation, FreshnessState } from './types';

/**
 * Freshness is presentation-only: it never rewrites the underlying observation.
 *
 * The only behaviour supported by the product source of truth (PRD §8) is:
 * an observation is fresh until `freshUntil`, after which it is expired and a
 * manual recheck is required.
 *
 * The exact Aging/Stale business boundaries are NOT defined anywhere in the
 * source of truth, so this module does not invent them. It derives only what is
 * explicitly supported:
 *
 *   - now <= freshUntil  -> FRESH
 *   - now >  freshUntil  -> STALE (and a recheck is required)
 *
 * `AGING` is a reserved, presentation-only value that only a backend/product
 * contract may supply. It is never derived on the frontend. When the real
 * contract defines the boundaries, replace this function — nothing else.
 */
export function computeFreshness(
  observation: Pick<CapacityObservation, 'freshUntil'>,
  now: Date,
): FreshnessState {
  return now.getTime() <= new Date(observation.freshUntil).getTime()
    ? 'FRESH'
    : 'STALE';
}

/** An observation past its freshness window should prompt a manual recheck. */
export function needsRecheck(
  observation: Pick<CapacityObservation, 'freshUntil'>,
  now: Date,
): boolean {
  return now.getTime() > new Date(observation.freshUntil).getTime();
}

/** Relative age copy, e.g. "today", "3 days ago". */
export function relativeAge(iso: string, now: Date): string {
  const days = Math.floor(
    (now.getTime() - new Date(iso).getTime()) / 86_400_000,
  );
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
