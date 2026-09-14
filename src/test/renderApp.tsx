import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import {
  createFixtureService,
  type FixtureServiceOptions,
} from '../services/fixtureService';
import { AuthProvider } from '../services/auth/AuthContext';
import { createFixtureAuth } from '../services/auth/fixtureAuth';
import type { AuthErrorCode } from '../services/auth/types';
import { ServiceProvider } from '../services/ServiceContext';

export interface RenderAppOptions {
  /** Product tests start signed in by default; auth tests pass false. */
  authed?: boolean;
  serviceOptions?: FixtureServiceOptions;
  /** Simulate an expired/unavailable session for the intentional states. */
  failGetSession?: AuthErrorCode;
}

/**
 * Renders the app at a route with a fixture backend and a provider-agnostic
 * fixture auth session. Call placement is instant (stepMs 0) for fast tests.
 */
export function renderApp(path: string, options: RenderAppOptions = {}) {
  const { authed = true, serviceOptions, failGetSession } = options;
  const auth = createFixtureAuth({
    session: authed
      ? { userId: 'user-test', email: 'parent@example.com', displayName: 'Demo parent' }
      : null,
    failGetSession,
  });

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider service={auth}>
        <ServiceProvider
          service={createFixtureService({ stepMs: 0, ...serviceOptions })}
        >
          <App />
        </ServiceProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}
