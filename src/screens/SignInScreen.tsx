import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth/AuthContext';
import { PRIMARY_APP_PATH } from '../domain/routes';

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
  const from = (location.state as { from?: string } | null)?.from ?? PRIMARY_APP_PATH;

  const [busyMethod, setBusyMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'ready' && session) navigate(from, { replace: true });
  }, [status, session, from, navigate]);

  const handleSignIn = async (methodId: string) => {
    setBusyMethod(methodId);
    setError(null);
    try {
      await signIn(methodId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed.');
    } finally {
      setBusyMethod(null);
    }
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

            <ul className="signin__methods">
              {capabilities?.methods.map((method) => (
                <li key={method.id}>
                  <button
                    type="button"
                    className={`btn signin__method ${
                      method.kind === 'oauth' ? 'btn--primary' : 'btn--ghost'
                    }`}
                    onClick={() => void handleSignIn(method.id)}
                    disabled={busyMethod !== null}
                  >
                    {busyMethod === method.id ? 'Signing in…' : method.label}
                  </button>
                  {method.hint ? (
                    <p className="signin__hint">{method.hint}</p>
                  ) : null}
                </li>
              ))}
            </ul>

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
