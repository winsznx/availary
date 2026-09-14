import { StateLabel } from './StateLabel';
import { FreshnessIndicator } from './FreshnessIndicator';
import { OpeningThread } from './OpeningThread';
import { DEMO_CLOCK_ISO } from '../fixtures/demo';
import { staticDemoRadar } from '../fixtures/staticRadar';
import { TIMELINE_TICKS, timelinePercent } from '../domain/timeline';

const HERO_PROVIDERS = ['little-sprouts', 'tiny-steps', 'oak-tree'];

/**
 * Static, illustrative Radar for the landing hero. It reuses the real product
 * components so the marketing UI and the app stay one system.
 */
export function RadarPreview() {
  const now = new Date(DEMO_CLOCK_ISO);
  const entries = staticDemoRadar(now).entries.filter((entry) =>
    HERO_PROVIDERS.includes(entry.provider.id),
  );

  return (
    <div className="radar-preview" role="img" aria-label="Illustrative availability radar">
      <div className="radar-preview__axis" aria-hidden="true">
        <div className="radar-preview__gutter" />
        <div className="radar-preview__track">
          {TIMELINE_TICKS.map((tick) => (
            <span
              key={tick.iso}
              className="radar-preview__tick tabular"
              style={{ left: `${timelinePercent(tick.iso)}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>

      {entries.map((entry) => (
        <div key={entry.provider.id} className="radar-preview__row">
          <div className="radar-preview__provider">
            <span className="radar-preview__name">{entry.provider.displayName}</span>
            <StateLabel state={entry.latest ? entry.latest.state : 'NOT_CHECKED'} />
            <FreshnessIndicator
              freshness={entry.freshness}
              observedAt={entry.latest?.observedAt}
              now={now}
              recheck={entry.recheckAllowed}
            />
          </div>
          <div className="radar-preview__thread">
            <OpeningThread entry={entry} />
          </div>
        </div>
      ))}

      <p className="radar-preview__note">
        Illustrative demo data, not live availability.
      </p>
    </div>
  );
}
