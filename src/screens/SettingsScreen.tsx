import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NOT_SHARED } from '../domain/callCopy';
import {
  formatAgeAtStart,
  formatDate,
  formatScheduleMode,
  formatWeekdays,
} from '../domain/format';
import { useAsync } from '../hooks/useAsync';
import { useService } from '../services/ServiceContext';
import { useAuth } from '../services/auth/AuthContext';

/**
 * Account/settings shell. Kept lean: identity, the current care search, privacy
 * and data controls, deletion, calling status, help and sign out. No password
 * maze, social profiles, billing, teams or extra personal fields.
 */
export function SettingsScreen() {
  const { session, signOut } = useAuth();
  const service = useService();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const careNeeds = useAsync(() => service.listCareNeeds(), [service]);

  // Account deletion is a backend operation (TECHNICAL-SPEC: DELETE /api/account).
  // It is not implemented in the fixture build, so the control is shown but not
  // faked. The backend adapter enables it.
  const deletionAvailable = false;

  const initials = (session?.displayName ?? session?.email ?? '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  const current = careNeeds.status === 'ready' ? careNeeds.data.at(-1) : undefined;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="screen settings">
      <h1 className="settings__title">Account</h1>

      <section className="settings__section">
        <h2 className="settings__h2">Account</h2>
        <div className="identity">
          <span className="identity__avatar" aria-hidden="true">
            {initials}
          </span>
          <div className="identity__meta">
            <p className="identity__name">{session?.displayName ?? 'Signed in'}</p>
            <p className="identity__email">{session?.email ?? 'Not signed in'}</p>
          </div>
        </div>
      </section>

      <section className="settings__section">
        <h2 className="settings__h2">Current care search</h2>
        {current ? (
          <dl className="facts">
            <div>
              <dt>Care search</dt>
              <dd>{current.label}</dd>
            </div>
            <div>
              <dt>Age at start</dt>
              <dd>{formatAgeAtStart(current.ageAtStartMonths)}</dd>
            </div>
            <div>
              <dt>Desired start</dt>
              <dd>{formatDate(current.desiredStartDate)}</dd>
            </div>
            <div>
              <dt>Weekdays</dt>
              <dd>{formatWeekdays(current.weekdays)}</dd>
            </div>
            <div>
              <dt>Care type</dt>
              <dd>{formatScheduleMode(current.scheduleMode)}</dd>
            </div>
          </dl>
        ) : (
          <p className="muted">No care search saved yet.</p>
        )}
      </section>

      <section className="settings__section">
        <h2 className="settings__h2">Privacy and data controls</h2>
        <p>
          Availary records timestamped availability observations. It does not
          collect unnecessary child data.
        </p>
        <ul className="plain-list plain-list--muted">
          {NOT_SHARED.map((item) => (
            <li key={item}>Never shared: {item}</li>
          ))}
        </ul>
        <Link to="/privacy" className="link-quiet">
          Read the privacy policy
        </Link>
      </section>

      <section className="settings__section">
        <h2 className="settings__h2">Account and data deletion</h2>
        <p>
          Deleting your account removes your shortlist, care search and recorded
          observations.
        </p>
        <button
          type="button"
          className="btn btn--danger"
          disabled={!deletionAvailable}
        >
          Delete account and data
        </button>
        {!deletionAvailable ? (
          <p className="muted settings__reason">
            Not available in this build. Account deletion is handled by the
            Availary backend.
          </p>
        ) : null}
      </section>

      <section className="settings__section">
        <h2 className="settings__h2">Calling status</h2>
        <p>
          {service.isFixture
            ? 'Demo mode. Data is synthetic and live calls are off.'
            : 'Live calling availability is provided by the Availary backend.'}
        </p>
        <p className="muted">
          A real call requires a signed-in account and your explicit approval.
        </p>
      </section>

      <section className="settings__section">
        <h2 className="settings__h2">Help and contact</h2>
        <ul className="plain-list">
          <li>
            <a href="mailto:hello@availary.app">hello@availary.app</a>
          </li>
          <li>
            <Link to="/privacy">Privacy policy</Link>
          </li>
          <li>
            <Link to="/terms">Terms of service</Link>
          </li>
        </ul>
      </section>

      <section className="settings__section">
        <h2 className="settings__h2">Session</h2>
        <button
          type="button"
          className="btn"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </section>
    </div>
  );
}
