import { computeFreshness, needsRecheck, relativeAge } from './freshness';

const observation = {
  observedAt: '2026-09-06T10:00:00Z',
  freshUntil: '2026-09-11T10:00:00Z',
};

test('an observation inside its freshness window is fresh', () => {
  expect(computeFreshness(observation, new Date('2026-09-09T10:00:00Z'))).toBe('FRESH');
});

test('an observation past its freshness window is stale', () => {
  expect(computeFreshness(observation, new Date('2026-09-12T10:00:00Z'))).toBe('STALE');
});

test('the frontend never invents the Aging/Stale boundary', () => {
  const probes = [
    '2026-09-11T09:59:00Z',
    '2026-09-11T10:01:00Z',
    '2026-09-30T00:00:00Z',
    '2027-01-01T00:00:00Z',
  ];
  for (const probe of probes) {
    expect(computeFreshness(observation, new Date(probe))).not.toBe('AGING');
  }
});

test('recheck is required exactly once the window has passed', () => {
  expect(needsRecheck(observation, new Date('2026-09-10T10:00:00Z'))).toBe(false);
  expect(needsRecheck(observation, new Date('2026-09-12T10:00:00Z'))).toBe(true);
});

test('relative age reads in plain language', () => {
  expect(relativeAge('2026-09-13T08:00:00Z', new Date('2026-09-13T09:00:00Z'))).toBe('today');
  expect(relativeAge('2026-09-09T09:00:00Z', new Date('2026-09-13T09:00:00Z'))).toBe('4 days ago');
});
