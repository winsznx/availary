import { CALL_STATE_COPY, PROGRESS_SEQUENCE, isTerminal } from '../domain/callCopy';
import type { CallRunView } from '../domain/types';

/**
 * Truthful progress and outcome rendering. Every state from the PRD is
 * reachable here; `UNKNOWN`/ambiguity never reads as `UNAVAILABLE`, and no
 * state optimistically claims an opening.
 */
export function CallProgressPanel({
  run,
  onReturn,
}: {
  run: CallRunView;
  onReturn: () => void;
}) {
  const copy = CALL_STATE_COPY[run.state];
  const terminal = isTerminal(run.state);
  const currentIndex = PROGRESS_SEQUENCE.indexOf(run.state);

  return (
    <div className="call-panel">
      <p className="call-panel__eyebrow">{run.provider.displayName}</p>
      <h1 className="call-panel__title">{copy.label}</h1>
      <p className="call-panel__detail" role="status">
        {copy.detail}
      </p>

      {run.state === 'COMPLETED' ? (
        <p className="call-panel__note">
          A new observation was added to the timeline. Earlier observations are
          kept, not overwritten.
        </p>
      ) : null}

      {run.placed ? (
        <p className="call-panel__no-redial">
          One call only. Availary will not dial this provider again
          automatically.
        </p>
      ) : null}

      <ol className="progress">
        {PROGRESS_SEQUENCE.map((state, index) => {
          const done = terminal || (currentIndex >= 0 && index < currentIndex);
          const current = !terminal && index === currentIndex;
          return (
            <li
              key={state}
              className={`progress__step${done ? ' progress__step--done' : ''}${
                current ? ' progress__step--current' : ''
              }`}
            >
              <span className="progress__dot" aria-hidden="true" />
              <span className="progress__label">
                {CALL_STATE_COPY[state].label}
              </span>
            </li>
          );
        })}
      </ol>

      {terminal ? (
        <div className="call-actions">
          <button type="button" className="btn btn--primary" onClick={onReturn}>
            Return to Radar
          </button>
        </div>
      ) : null}
    </div>
  );
}
