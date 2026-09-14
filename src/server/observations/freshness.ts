import { OBSERVATION_FRESH_WINDOW_MS } from '../../shared/constants';

/**
 * Server-authoritative counterpart to `src/domain/freshness.ts`: this module
 * SETS `fresh_until` when an observation is persisted; the frontend only ever
 * DERIVES presentation state from that stored value. Keep the same rule on
 * both sides — an observation is fresh until `freshUntil`, nothing else.
 */
export function computeFreshUntil(observedAt: Date): string {
  return new Date(observedAt.getTime() + OBSERVATION_FRESH_WINDOW_MS).toISOString();
}
