import { relativeAge } from '../domain/freshness';
import { FRESHNESS_LABEL, NEEDS_RECHECK_LABEL } from '../domain/labels';
import type { FreshnessState } from '../domain/types';

export function FreshnessIndicator({
  freshness,
  observedAt,
  now,
  recheck,
}: {
  freshness: FreshnessState;
  observedAt?: string;
  now: Date;
  recheck: boolean;
}) {
  const label = recheck ? NEEDS_RECHECK_LABEL : FRESHNESS_LABEL[freshness];
  const age = observedAt ? relativeAge(observedAt, now) : null;
  return (
    <span className={`freshness freshness--${freshness.toLowerCase()}`}>
      <span className="freshness__label">{label}</span>
      {age ? <span className="freshness__age"> · {age}</span> : null}
    </span>
  );
}
