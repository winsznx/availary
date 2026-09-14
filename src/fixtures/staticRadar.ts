import { computeFreshness, needsRecheck } from '../domain/freshness';
import type { Radar, RadarEntry } from '../domain/types';
import {
  DEMO_CLOCK_ISO,
  demoCareNeed,
  demoObservations,
  demoProviders,
} from './demo';

/**
 * Synchronous Radar model for static/illustrative surfaces (the landing hero).
 * Mirrors the fixture adapter's read logic without the async boundary.
 */
export function staticDemoRadar(now: Date = new Date(DEMO_CLOCK_ISO)): Radar {
  const entries: RadarEntry[] = demoProviders.map((provider) => {
    const history = demoObservations
      .filter(
        (o) =>
          o.providerId === provider.id && o.careNeedId === demoCareNeed.id,
      )
      .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    const latest = history.length ? history[history.length - 1] : null;

    return {
      provider,
      careNeed: demoCareNeed,
      latest,
      freshness: latest ? computeFreshness(latest, now) : 'FRESH',
      history,
      recheckAllowed:
        !provider.doNotContact && (!latest || needsRecheck(latest, now)),
    };
  });

  return { careNeed: demoCareNeed, entries };
}
