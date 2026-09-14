import type { RadarEntry } from '../domain/types';
import { formatDate } from '../domain/format';
import { STATE_LABEL } from '../domain/labels';
import { openingWindow, timelinePercent } from '../domain/timeline';

/**
 * One dated Opening Thread rail for a provider: observation markers plotted at
 * their observed time, plus a real span for an expected-opening window.
 * Bars are positioned on the shared axis; the parent supplies the axis labels.
 */
export function OpeningThread({ entry }: { entry: RadarEntry }) {
  const { latest, history, careNeed, provider } = entry;
  const window = latest
    ? openingWindow(latest, careNeed.desiredStartDate, careNeed.flexibilityDays)
    : null;

  return (
    <div
      className="thread"
      role="img"
      aria-label={`Availability timeline for ${provider.displayName}`}
    >
      <div className="thread__rail" aria-hidden="true" />

      {window ? (
        <div
          className="thread__window"
          style={{ left: `${window.leftPercent}%`, width: `${window.widthPercent}%` }}
        >
          <span className="thread__window-text">{window.text}</span>
        </div>
      ) : null}

      {history.map((observation) => (
        <span
          key={observation.id}
          className={`thread__marker thread__marker--${observation.state
            .toLowerCase()
            .replace(/_/g, '-')}`}
          style={{ left: `${timelinePercent(observation.observedAt)}%` }}
          title={`${STATE_LABEL[observation.state]} · checked ${formatDate(
            observation.observedAt,
          )}`}
        />
      ))}
    </div>
  );
}
