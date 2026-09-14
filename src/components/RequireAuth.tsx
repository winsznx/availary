import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../services/auth/AuthContext';

/**
 * Guards persistent/live-capable product state (Radar, calls, settings).
 * Creation flow routes (`/start`, `/providers`) stay public.
 *
 * A missing session redirects to sign-in while preserving the intended route.
 * An expired or unavailable session shows a clear, non-breaking state instead.
 */
export function RequireAuth() {
  const { status, session, sessionError } = useAuth();
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;

  if (status === 'loading') {
    return <p className="muted">Checking your session…</p>;
  }

  if (session) {
    return <Outlet />;
  }

  if (status === 'error') {
    const expired = sessionError === 'expired';
    return (
      <section className="session-state">
        <h1 className="session-state__title">
          {expired ? 'Your session expired' : 'We could not confirm your session'}
        </h1>
        <p className="session-state__lede">
          {expired
            ? 'Sign in again to return to your Radar. Your shortlist and care search are still here.'
            : 'Sign-in is unavailable right now. You can try again in a moment.'}
        </p>
        <div className="session-state__actions">
          <Link to="/signin" state={{ from }} className="btn btn--primary">
            Sign in again
          </Link>
          <Link to="/demo" className="btn btn--ghost">
            Continue in the demo
          </Link>
        </div>
      </section>
    );
  }

  return <Navigate to="/signin" replace state={{ from }} />;
}
