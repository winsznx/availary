import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth/AuthContext';
import { EmailLinkSent } from '../services/auth/types';
import { PRIMARY_APP_PATH } from '../domain/routes';

/**
 * Persists the intended destination across a magic-link/OAuth redirect. Both
 * providers send the browser away from React Router's in-memory state (a
 * fresh navigation back from email, or a full OAuth round trip), so `from`
 * has to survive outside `location.state` to still work afterward.
 */
const POST_AUTH_REDIRECT_KEY = 'availary.postAuthRedirect';

function readStoredRedirect(): string | null {
  try {
    return localStorage.getItem(POST_AUTH_REDIRECT_KEY);
  } catch {
    return null;
  }
}

function storeRedirect(path: string): void {
  try {
    localStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
  } catch {
    // Best-effort only — worst case the user lands on PRIMARY_APP_PATH instead.
  }
}

function clearStoredRedirect(): void {
  try {
    localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

/**
 * Dedicated split sign-in page: dark brand panel on the left, sign-in card on
 * the right.
 *
 * Methods come from the auth boundary; nothing here is provider-specific
 * hard-wiring, and no Google or email account is contacted in this build.
 */
export function SignInScreen() {
  const { status, session, capabilities, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? readStoredRedirect() ?? PRIMARY_APP_PATH;

  const [busyMethod, setBusyMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (status === 'ready' && session) {
      clearStoredRedirect();
      navigate(from, { replace: true });
    }
  }, [status, session, from, navigate]);

  const runSignIn = async (methodId: string, input?: string) => {
    setBusyMethod(methodId);
    setError(null);
    storeRedirect(from);
    try {
      await signIn(methodId, input);
    } catch (cause) {
      if (cause instanceof EmailLinkSent) {
        setLinkSentTo(cause.email);
      } else {
        clearStoredRedirect();
        setError(cause instanceof Error ? cause.message : 'Sign-in failed.');
      }
    } finally {
      setBusyMethod(null);
    }
  };

  const handleEmailSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    void runSignIn('email', email.trim());
  };

  return (
    <section className="signin-page">
      <div className="signin-page__grid">
        <aside className="signin-page__aside">
          <img
            src="/opening-window-light.svg"
            alt=""
            aria-hidden="true"
            className="signin-page__pattern"
          />
          <p className="signin-page__eyebrow">Availary</p>
          <h2 className="signin-page__aside-title">
            Your shortlist, kept current.
          </h2>
          <p className="signin-page__aside-lede">
            Availability moves. Availary keeps the timing, the evidence and your
            providers together in one place.
          </p>
          <ul className="signin-page__list">
            <li>Keep your providers and care search together</li>
            <li>Keep every availability check and its evidence</li>
            <li>Reopen your Radar whenever you need it</li>
          </ul>
        </aside>

        <div className="signin-page__panel">
          <div className="signin__card">
            <h1 className="signin__title">Save your care search</h1>
            <p className="signin__lede">
              Sign in to keep your providers, availability checks, and updates in
              one place.
            </p>

            {status === 'loading' ? (
              <p className="muted">Loading sign-in options…</p>
            ) : null}

            {capabilities && !capabilities.configured ? (
              <p className="signin__note">
                Sign-in is not finalised yet. This build creates a local session
                only. No Google or email account is contacted.
              </p>
            ) : null}

            {linkSentTo ? (
              <p className="signin__note" role="status">
                We sent a sign-in link to <strong>{linkSentTo}</strong>. Check your
                inbox and click it to continue — this tab will pick up the
                session automatically.
              </p>
            ) : (
              <ul className="signin__methods">
                {capabilities?.methods.map((method) =>
                  method.kind === 'email_link' ? (
                    <li key={method.id}>
                      <form onSubmit={handleEmailSubmit}>
                        <div className="field">
                          <label htmlFor="signin-email">Email address</label>
                          <input
                            id="signin-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            disabled={busyMethod !== null}
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn signin__method btn--ghost"
                          disabled={busyMethod !== null}
                        >
                          {busyMethod === method.id ? 'Sending link…' : method.label}
                        </button>
                        {method.hint ? <p className="signin__hint">{method.hint}</p> : null}
                      </form>
                    </li>
                  ) : (
                    <li key={method.id}>
                      <button
                        type="button"
                        className="btn signin__method btn--primary"
                        onClick={() => void runSignIn(method.id)}
                        disabled={busyMethod !== null}
                      >
                        {busyMethod === method.id ? 'Signing in…' : method.label}
                      </button>
                      {method.hint ? <p className="signin__hint">{method.hint}</p> : null}
                    </li>
                  ),
                )}
              </ul>
            )}

            {error ? (
              <p className="error-note" role="alert">
                {error}
              </p>
            ) : null}

            <div className="signin__aside">
              <Link to="/demo" className="btn btn--ghost">
                Try the demo instead
              </Link>
              <Link to="/" className="link-quiet">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
