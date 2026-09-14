import { OBSERVATION_FRESH_WINDOW_MS } from '../../shared/constants';
import { computeFreshUntil } from './freshness';

test('fresh_until is exactly the observation window ahead of observedAt', () => {
  // #given a fixed observation time
  const observedAt = new Date('2026-01-01T00:00:00.000Z');
  // #when computing fresh_until
  const freshUntil = computeFreshUntil(observedAt);
  // #then it is observedAt + the configured window, not wall-clock now
  expect(new Date(freshUntil).getTime() - observedAt.getTime()).toBe(
    OBSERVATION_FRESH_WINDOW_MS,
  );
});
