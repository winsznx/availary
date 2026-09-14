import { buildIdempotencyKey, isAllowlistedNumber } from './constants';

test('the idempotency key is stable for the same user and call intent', () => {
  // #given the same user and call intent id
  // #when the key is built twice (e.g. on retry)
  const first = buildIdempotencyKey('user-1', 'intent-1');
  const second = buildIdempotencyKey('user-1', 'intent-1');
  // #then it is byte-for-byte identical — never derived from wall-clock time
  expect(first).toBe(second);
  expect(first).toBe('availary:user-1:intent-1');
});

test('an empty allowlist places no restriction beyond authentication', () => {
  // #given no allowlist configured (production legal basis)
  // #when checking any number
  // #then it is allowed
  expect(isAllowlistedNumber('+15551234567', '')).toBe(true);
});

test('a non-empty allowlist rejects a number not on it', () => {
  // #given a hackathon-verification allowlist with one consented number
  // #when checking a different number
  // #then it is rejected
  expect(isAllowlistedNumber('+15559999999', '+15551234567')).toBe(false);
  expect(isAllowlistedNumber('+15551234567', ' +15551234567 , +15550000000')).toBe(true);
});
