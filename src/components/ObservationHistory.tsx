import type { CapacityObservation } from '../domain/types';
import { formatDate } from '../domain/format';
import { StateLabel } from './StateLabel';

/**
 * Observation history as a transition chain (e.g. Waitlist only → Expected
 * opening). Older observations are preserved, never overwritten.
 */
export function ObservationHistory({
  history,
}: {
  history: CapacityObservation[];
}) {
  if (history.length === 0) {
    return <p className="muted">Not checked yet. No observations recorded.</p>;
  }

  return (
    <ol className="history">
      {history.map((observation, index) => (
        <li key={observation.id} className="history__item">
          {index > 0 ? (
            <span className="history__arrow" aria-hidden="true">
              →
            </span>
          ) : null}
          <div className="history__body">
            <StateLabel state={observation.state} />
            <span className="history__date tabular">
              {formatDate(observation.observedAt)}
            </span>
            {observation.earliestOpeningText ? (
              <span className="history__window">
                Reported opening: {observation.earliestOpeningText}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
