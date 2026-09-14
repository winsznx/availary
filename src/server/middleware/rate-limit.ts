/**
 * Best-effort per-isolate throttle on live-call mutations: prevents button
 * spamming and accidental loops from the same warm Worker instance. This is
 * a defense-in-depth layer, not the source of truth — the DB's unique
 * constraints (`call_intents.idempotency_key`, `call_runs.call_intent_id`)
 * are what actually make dispatch idempotent across isolates/restarts.
 */
const lastAttempt = new Map<string, number>();

const MIN_GAP_MS = 30_000;

export function isRateLimited(key: string): boolean {
  const last = lastAttempt.get(key);
  const now = Date.now();
  if (last !== undefined && now - last < MIN_GAP_MS) {
    return true;
  }
  lastAttempt.set(key, now);
  return false;
}
