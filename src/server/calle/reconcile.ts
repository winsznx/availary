import type { CallRunStatus } from '../../shared/types';
import { CalleRequestError } from './client';
import type { CalleCallStatus } from './schema';

const TERMINAL_STATUSES: ReadonlySet<CallRunStatus> = new Set([
  'COMPLETED',
  'FAILED',
  'CANCELED',
]);

export function isTerminalRunStatus(status: CallRunStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * What to do after `POST /v1/calls` either throws or the response is
 * ambiguous. The create sequence in TECHNICAL-SPEC.md is explicit: if the
 * outcome is unclear, mark `RECONCILE_REQUIRED` and never mint a fresh
 * idempotency key or place a second call for the same intent. Only a clean,
 * unambiguous 4xx (the request itself was rejected, nothing was dispatched)
 * is safe to mark `FAILED` outright.
 */
export function classifyCreateFailure(error: unknown): 'FAILED' | 'RECONCILE_REQUIRED' {
  if (error instanceof CalleRequestError) {
    // 400/401/403/404/422 mean CALL-E rejected the request before dispatch —
    // nothing was created, so it is safe to fail closed without reconciling.
    if (error.status >= 400 && error.status < 500 && error.status !== 429) {
      return 'FAILED';
    }
  }
  // Network failure, timeout, 429, or 5xx: we cannot tell whether the call
  // was actually created. Never guess — always reconcile via GET.
  return 'RECONCILE_REQUIRED';
}

/**
 * Maps a remote CALL-E status onto our local run status. Deliberately
 * conservative: only the CALL-E terminal states map to our terminal states.
 * Every other value keeps the run polling rather than assuming completion.
 */
export function mapCalleStatusToRunStatus(remote: CalleCallStatus['status']): CallRunStatus {
  switch (remote) {
    case 'completed':
      return 'COMPLETED';
    case 'failed':
    case 'no_answer':
    case 'refused':
      return 'FAILED';
    case 'canceled':
      return 'CANCELED';
    case 'queued':
      return 'QUEUED';
    case 'in_progress':
      return 'IN_PROGRESS';
    default:
      return 'RECONCILE_REQUIRED';
  }
}
