import { Link } from 'react-router-dom';
import {
  formatAgeAtStart,
  formatDate,
  formatScheduleMode,
  formatWeekdays,
} from '../domain/format';
import { TIMELINE_TICKS, timelinePercent } from '../domain/timeline';
import type { Radar as RadarModel } from '../domain/types';
import { FreshnessIndicator } from './FreshnessIndicator';
import { OpeningThread } from './OpeningThread';
import { StateLabel } from './StateLabel';

/**
 * The flagship surface: a stable provider column beside a shared horizontal
 * time axis with one Opening Thread per provider. Never a data table.
 * The provider identity and thread link to the real provider route; a recheck
 * routes to the call preview (never dials directly).
 */
export function Radar({
  radar,
  now,
  onRecheck,
}: {
  radar: RadarModel;
  now: Date;
  onRecheck?: (providerId: string) => void;
}) {
  const { careNeed, entries } = radar;

  return (
    <section className="radar" aria-label="Availability radar">
      <header className="radar__head">
        <h1 className="radar__title">Your Opening Radar</h1>
        <p className="care-need-strip tabular">
          {formatAgeAtStart(careNeed.ageAtStartMonths)} at start ·{' '}
          {formatDate(careNeed.desiredStartDate)} ·{' '}
          {formatWeekdays(careNeed.weekdays)} · {formatScheduleMode(careNeed.scheduleMode)}
        </p>
      </header>

      <div className="radar__axis" aria-hidden="true">
        <div className="radar__axis-gutter" />
        <div className="radar__axis-track">
          {TIMELINE_TICKS.map((tick) => (
            <span
              key={tick.iso}
              className="radar__tick tabular"
              style={{ left: `${timelinePercent(tick.iso)}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="radar__empty">
          No providers yet. <Link to="/providers">Add a provider</Link> to start
          recording availability.
        </p>
      ) : (
        <ul className="radar__rows">
          {entries.map((entry) => {
            const state = entry.latest ? entry.latest.state : 'NOT_CHECKED';
            const detailHref = `/providers/${entry.provider.id}?need=${careNeed.id}`;

            return (
              <li key={entry.provider.id} className="radar-row">
                <div className="radar-row__grid">
                  <div className="radar-row__provider">
                    <Link to={detailHref} className="radar-row__name">
                      {entry.provider.displayName}
                    </Link>
                    <StateLabel state={state} />
                    <FreshnessIndicator
                      freshness={entry.freshness}
                      observedAt={entry.latest?.observedAt}
                      now={now}
                      recheck={entry.recheckAllowed}
                    />
                    {onRecheck && entry.recheckAllowed ? (
                      <button
                        type="button"
                        className="btn btn--small"
                        onClick={() => onRecheck(entry.provider.id)}
                      >
                        Recheck
                      </button>
                    ) : null}
                  </div>
                  <Link
                    to={detailHref}
                    className="radar-row__thread"
                    aria-label={`Open ${entry.provider.displayName} detail`}
                  >
                    <OpeningThread entry={entry} />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
