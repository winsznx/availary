import { CalleRequestError } from './client';
import { classifyCreateFailure, isTerminalRunStatus, mapCalleStatusToRunStatus } from './reconcile';

test('lost create response reconciles instead of assuming failure', () => {
  // #given a network-level failure (fetch threw, not a CALL-E response)
  // #when classifying what to do next
  // #then it reconciles — never redials with a new key, never assumes FAILED
  expect(classifyCreateFailure(new TypeError('network error'))).toBe('RECONCILE_REQUIRED');
});

test('a 5xx or 429 from CALL-E also requires reconciliation, not a guess', () => {
  expect(classifyCreateFailure(new CalleRequestError(500, 'server error'))).toBe(
    'RECONCILE_REQUIRED',
  );
  expect(classifyCreateFailure(new CalleRequestError(429, 'rate limited'))).toBe(
    'RECONCILE_REQUIRED',
  );
});

test('a clean 4xx rejection means nothing was dispatched, so it fails closed', () => {
  // #given CALL-E rejected the request itself (bad input, not a timeout)
  // #when classifying the failure
  // #then it is safe to mark FAILED without reconciling
  expect(classifyCreateFailure(new CalleRequestError(400, 'bad request'))).toBe('FAILED');
});

test('result null (queued/in-progress) never jumps to a terminal state', () => {
  expect(mapCalleStatusToRunStatus('queued')).toBe('QUEUED');
  expect(mapCalleStatusToRunStatus('in_progress')).toBe('IN_PROGRESS');
  expect(isTerminalRunStatus(mapCalleStatusToRunStatus('queued'))).toBe(false);
});

test('recipient refusal and no-answer map to distinguishable failure states', () => {
  expect(mapCalleStatusToRunStatus('refused')).toBe('FAILED');
  expect(mapCalleStatusToRunStatus('no_answer')).toBe('FAILED');
  expect(mapCalleStatusToRunStatus('completed')).toBe('COMPLETED');
  expect(mapCalleStatusToRunStatus('canceled')).toBe('CANCELED');
});
