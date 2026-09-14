import { X } from 'lucide-react';
import { useRef } from 'react';
import { formatDate } from '../domain/format';
import { relativeAge } from '../domain/freshness';
import {
  NEEDS_RECHECK_LABEL,
  SCHEDULE_FIT_LABEL,
  TRI_STATE_LABEL,
} from '../domain/labels';
import { openingWindow } from '../domain/timeline';
import type { RadarEntry } from '../domain/types';
import { useAsync } from '../hooks/useAsync';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { useService } from '../services/ServiceContext';
import { EvidenceList } from './EvidenceList';
import { FreshnessIndicator } from './FreshnessIndicator';
import { ObservationHistory } from './ObservationHistory';
import { StateLabel } from './StateLabel';

/**
 * Provider detail: desktop right-side drawer, mobile full-height sheet.
 * Shows compatibility, history, evidence, freshness and recheck availability.
 */
export function ProviderDetail({
  entry,
  now,
  onClose,
  onRecheck,
  onToggleDoNotContact,
}: {
  entry: RadarEntry;
  now: Date;
  onClose: () => void;
  onRecheck: () => void;
  onToggleDoNotContact: (next: boolean) => void;
}) {
  const service = useService();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, onClose);

  const latest = entry.latest;
  const latestId = latest?.id;
  const evidence = useAsync(
    () =>
      latestId
        ? service.getObservationEvidence(latestId)
        : Promise.resolve([]),
    [service, latestId],
  );

  const titleId = `provider-detail-${entry.provider.id}`;
  const window = latest
    ? openingWindow(latest, entry.careNeed.desiredStartDate, entry.careNeed.flexibilityDays)
    : null;

  return (
    <>
      <div
        className="provider-detail__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="provider-detail"
      >
        <header className="provider-detail__head">
          <div>
            <p className="provider-detail__eyebrow">Provider</p>
            <h2 id={titleId} className="provider-detail__title">
              {entry.provider.displayName}
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close provider detail"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="provider-detail__status">
          <StateLabel state={latest ? latest.state : 'NOT_CHECKED'} />
          <FreshnessIndicator
            freshness={entry.freshness}
            observedAt={latest?.observedAt}
            now={now}
            recheck={entry.recheckAllowed}
          />
        </div>

        {latest ? (
          <p className="provider-detail__checked tabular">
            Checked by phone {formatDate(latest.observedAt)} ·{' '}
            {relativeAge(latest.observedAt, now)}
          </p>
        ) : (
          <p className="provider-detail__checked muted">
            Not checked in this shortlist yet.
          </p>
        )}

        {window ? (
          <p className="provider-detail__window">
            Expected opening reported for {window.text}.
          </p>
        ) : null}

        <section className="provider-detail__section">
          <h3 className="provider-detail__h3">Compatibility</h3>
          {latest ? (
            <dl className="facts">
              <div>
                <dt>Age band fit</dt>
                <dd>{TRI_STATE_LABEL[latest.ageBandFit]}</dd>
              </div>
              <div>
                <dt>Schedule fit</dt>
                <dd>{SCHEDULE_FIT_LABEL[latest.scheduleFit]}</dd>
              </div>
              <div>
                <dt>Full-time fit</dt>
                <dd>{TRI_STATE_LABEL[latest.fullTimeFit]}</dd>
              </div>
              <div>
                <dt>Waitlist</dt>
                <dd>{TRI_STATE_LABEL[latest.waitlistOpen]}</dd>
              </div>
              <div>
                <dt>Tour</dt>
                <dd>{TRI_STATE_LABEL[latest.tourAvailable]}</dd>
              </div>
            </dl>
          ) : (
            <p className="muted">Compatibility is not established yet.</p>
          )}
        </section>

        <section className="provider-detail__section">
          <h3 className="provider-detail__h3">Observation history</h3>
          <ObservationHistory history={entry.history} />
        </section>

        <section className="provider-detail__section">
          <h3 className="provider-detail__h3">Evidence</h3>
          {evidence.status === 'loading' ? (
            <p className="muted">Loading evidence…</p>
          ) : null}
          {evidence.status === 'ready' ? (
            <EvidenceList evidence={evidence.data} />
          ) : null}
        </section>

        <section className="provider-detail__section provider-detail__actions">
          <h3 className="provider-detail__h3">Actions</h3>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onRecheck}
            disabled={!entry.recheckAllowed}
          >
            {latest ? 'Recheck availability' : 'Check availability'}
          </button>
          {!entry.recheckAllowed ? (
            <p className="muted provider-detail__reason">
              {entry.provider.doNotContact
                ? 'Do not contact is on for this provider.'
                : `This observation is still fresh (${NEEDS_RECHECK_LABEL} is not needed yet).`}
            </p>
          ) : null}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onToggleDoNotContact(!entry.provider.doNotContact)}
          >
            {entry.provider.doNotContact
              ? 'Allow contact again'
              : 'Mark do not contact'}
          </button>
        </section>
      </aside>
    </>
  );
}
