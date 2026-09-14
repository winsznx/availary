import { STATE_LABEL } from '../domain/labels';
import type { UiAvailabilityState } from '../domain/types';

const slug = (state: UiAvailabilityState) => state.toLowerCase().replace(/_/g, '-');

/**
 * State is always written text first; colour and the dot are supplemental.
 * Internal enum names never appear here.
 */
export function StateLabel({ state }: { state: UiAvailabilityState }) {
  return (
    <span className={`state-label state-label--${slug(state)}`}>
      <span className="state-label__dot" aria-hidden="true" />
      <span className="state-label__text">{STATE_LABEL[state]}</span>
    </span>
  );
}
