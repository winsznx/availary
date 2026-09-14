import { Link } from 'react-router-dom';
import {
  NOT_SHARED,
  QUESTION_CATEGORIES,
  sharedCareFacts,
} from '../domain/callCopy';
import { canPlaceLiveCall } from '../domain/liveCalls';
import type { ConsentBasis, CallRunView } from '../domain/types';
import { useService } from '../services/ServiceContext';
import { useAuth } from '../services/auth/AuthContext';

const CONSENT_LABEL: Record<ConsentBasis, string> = {
  owned_test_number: 'Test number owned by Availary',
  explicit_provider_consent: 'Explicit provider consent',
  production_legal_basis: 'Production legal basis',
};

/**
 * The trust surface. Every call — first check or recheck — passes through this
 * preview before anything is placed. Nothing here has a side effect.
 */
export function CallPreviewPanel({
  run,
  onPlace,
  busy,
}: {
  run: CallRunView;
  onPlace: () => void;
  busy: boolean;
}) {
  const service = useService();
  const { session } = useAuth();
  const liveAllowed = canPlaceLiveCall({
    isFixture: service.isFixture,
    signedIn: Boolean(session),
  });

  return (
    <div className="call-panel">
      <p className="call-panel__eyebrow">Call preview</p>
      <h1 className="call-panel__title">
        Review the exact availability question before any call.
      </h1>

      <dl className="facts facts--two">
        <div>
          <dt>Provider</dt>
          <dd>{run.provider.displayName}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd className="tabular">{run.provider.maskedPhone}</dd>
        </div>
        <div>
          <dt>Region</dt>
          <dd>{run.provider.region}</dd>
        </div>
        <div>
          <dt>Language</dt>
          <dd>{run.provider.locale}</dd>
        </div>
      </dl>

      <section className="call-panel__section">
        <h2 className="call-panel__h2">What Availary will ask</h2>
        <ul className="plain-list">
          {QUESTION_CATEGORIES.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </section>

      <section className="call-panel__section">
        <h2 className="call-panel__h2">Care facts shared</h2>
        <ul className="plain-list">
          {sharedCareFacts(run.careNeed).map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </section>

      <section className="call-panel__section">
        <h2 className="call-panel__h2">Never shared</h2>
        <ul className="plain-list plain-list--muted">
          {NOT_SHARED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className="call-side-effect">
        This action places <strong>one real external phone call</strong> to{' '}
        {run.provider.displayName} on your behalf. Availary will not call again
        automatically, and there is no automatic second call.
      </p>

      {service.isFixture ? (
        <p className="demo-notice">
          Demo data. In this prototype, placing the call is simulated. No real
          call is made.
        </p>
      ) : null}

      <p className="call-panel__boundary">
        {liveAllowed
          ? 'A real call requires your explicit approval with the button below.'
          : 'Live calling is off in this build. A real call will require a signed-in account and your explicit approval.'}
      </p>

      <div className="call-actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onPlace}
          disabled={busy}
        >
          {busy ? 'Placing one call…' : 'Place one call'}
        </button>
        <Link to={`/radar/${run.careNeedId}`} className="btn btn--ghost">
          Back to Radar
        </Link>
      </div>

      <p className="call-panel__consent">
        Consent basis: {CONSENT_LABEL[run.provider.consentBasis]}
      </p>
    </div>
  );
}
