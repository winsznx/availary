import { DEMO_CLOCK_ISO } from '../fixtures/demo';
import { createFixtureService } from './fixtureService';

const now = new Date(DEMO_CLOCK_ISO);
const service = () => createFixtureService();

test('the radar exposes one entry per shortlisted provider', async () => {
  const radar = await service().getRadar('need-demo');
  expect(radar.entries).toHaveLength(4);
  expect(radar.entries.map((e) => e.provider.displayName)).toEqual([
    'Little Sprouts',
    'Bright House',
    'Oak Tree',
    'Tiny Steps',
  ]);
});

test('observation history preserves the waitlist to expected-opening transition', async () => {
  const radar = await service().getRadar('need-demo');
  const littleSprouts = radar.entries.find((e) => e.provider.id === 'little-sprouts');
  expect(littleSprouts?.latest?.state).toBe('EXPECTED_OPENING');
  expect(littleSprouts?.history.map((o) => o.state)).toEqual([
    'WAITLIST_ONLY',
    'EXPECTED_OPENING',
  ]);
  expect(littleSprouts?.history[1].supersedesObservationId).toBe('obs-ls-1');
});

test('stale unknown observation allows a recheck; do-not-contact blocks it', async () => {
  const svc = service();
  const radar = await svc.getRadar('need-demo');
  const oakTree = radar.entries.find((e) => e.provider.id === 'oak-tree');
  expect(oakTree?.latest?.state).toBe('UNKNOWN');
  expect(oakTree?.freshness).toBe('STALE');
  expect(oakTree?.recheckAllowed).toBe(true);

  await svc.setDoNotContact('oak-tree', true);
  const after = await svc.getRadar('need-demo');
  expect(after.entries.find((e) => e.provider.id === 'oak-tree')?.recheckAllowed).toBe(false);
});

test('partial fit records only the compatible weekdays', async () => {
  const radar = await service().getRadar('need-demo');
  const brightHouse = radar.entries.find((e) => e.provider.id === 'bright-house');
  expect(brightHouse?.latest?.state).toBe('PARTIAL_FIT');
  expect(brightHouse?.latest?.weekdaysAvailable).toEqual(['tue', 'thu']);
});

test('evidence is available for a supported claim', async () => {
  const evidence = await service().getObservationEvidence('obs-ls-2');
  expect(evidence.some((e) => e.verifiedInTranscript)).toBe(true);
});

test('the fixture service never reports itself as live', () => {
  expect(service().isFixture).toBe(true);
});

test('an unknown provider or care need never creates a preview run', async () => {
  const svc = service();
  await expect(svc.previewProviderCall('nope', 'need-demo')).rejects.toThrow();
  await expect(svc.previewProviderCall('oak-tree', 'nope')).rejects.toThrow();
});

test('a preview has no side effect on availability', async () => {
  const svc = createFixtureService({ stepMs: 0 });
  const run = await svc.previewProviderCall('oak-tree', 'need-demo');
  expect(run.state).toBe('PREVIEW');
  expect(run.placed).toBe(false);

  const radar = await svc.getRadar('need-demo');
  const oakTree = radar.entries.find((e) => e.provider.id === 'oak-tree');
  expect(oakTree?.latest?.state).toBe('UNKNOWN');
  expect(oakTree?.history).toHaveLength(1);
});

test('placing one call records an observation and never marks OPEN now', async () => {
  const svc = createFixtureService({ stepMs: 0 });
  const preview = await svc.previewProviderCall('oak-tree', 'need-demo');
  const done = await svc.placeOneCall(preview.id);

  expect(done.state).toBe('COMPLETED');
  expect(done.placed).toBe(true);
  expect(done.observationId).toBeTruthy();

  const radar = await svc.getRadar('need-demo');
  const oakTree = radar.entries.find((e) => e.provider.id === 'oak-tree');
  expect(oakTree?.latest?.state).toBe('EXPECTED_OPENING');
  expect(oakTree?.latest?.state).not.toBe('OPEN_NOW');
  expect(oakTree?.history).toHaveLength(2);
  expect(oakTree?.history[1].supersedesObservationId).toBe('obs-ot-1');
  expect(oakTree?.recheckAllowed).toBe(false);
});

test('one call is never dialed twice for the same run', async () => {
  const svc = createFixtureService({ stepMs: 0 });
  const preview = await svc.previewProviderCall('oak-tree', 'need-demo');
  const first = await svc.placeOneCall(preview.id);
  const second = await svc.placeOneCall(preview.id);

  expect(second.observationId).toBe(first.observationId);
  const radar = await svc.getRadar('need-demo');
  expect(
    radar.entries.find((e) => e.provider.id === 'oak-tree')?.history,
  ).toHaveLength(2);
});

test('an unreached call establishes nothing', async () => {
  const svc = createFixtureService({ stepMs: 0 });
  const preview = await svc.previewProviderCall('bright-house', 'need-demo');
  const done = await svc.placeOneCall(preview.id);

  expect(done.state).toBe('UNREACHED');
  expect(done.observationId).toBeUndefined();

  const radar = await svc.getRadar('need-demo');
  const brightHouse = radar.entries.find((e) => e.provider.id === 'bright-house');
  expect(brightHouse?.latest?.state).toBe('PARTIAL_FIT');
  expect(brightHouse?.history).toHaveLength(1);
});

void now;
