/** Constants shared between the Worker and any future non-React consumer. */

export const CALLE_DEFAULT_BASE_URL = 'https://api.heycall-e.com';

export const IDEMPOTENCY_KEY_PREFIX = 'availary';

/** How long a `CallIntent` preview stays valid before it must be re-previewed. */
export const CALL_INTENT_EXPIRY_MS = 15 * 60_000;

/** How long a completed observation stays FRESH before a recheck is offered. */
export const OBSERVATION_FRESH_WINDOW_MS = 7 * 86_400_000;

/** Minimum gap between polling the remote CALL-E status endpoint for one call. */
export const CALLE_POLL_THROTTLE_MS = 4_000;

export function buildIdempotencyKey(userId: string, callIntentId: string): string {
  return `${IDEMPOTENCY_KEY_PREFIX}:${userId}:${callIntentId}`;
}

/**
 * Live-mode safety gate (CLAUDE-HANDOFF.md: "Live hackathon verification:
 * allowlisted, consented number only"). An empty allowlist means no
 * additional restriction beyond authentication + explicit approval — a
 * production deployment with a real legal basis for calling would leave it
 * empty. During the hackathon verification window it should hold exactly
 * the one consented test number.
 */
export function isAllowlistedNumber(phoneE164: string, allowlistCsv: string): boolean {
  const allowlist = allowlistCsv
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (allowlist.length === 0) return true;
  return allowlist.includes(phoneE164);
}
