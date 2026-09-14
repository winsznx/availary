import {
  AuthError,
  type AuthCapabilities,
  type AuthErrorCode,
  type AuthService,
  type AuthSession,
} from './types';

export const MOCK_GOOGLE_METHOD_ID = 'mock-google';
export const MOCK_EMAIL_METHOD_ID = 'mock-email';

/**
 * Locked UX: Google is visually primary, email is secondary and will become
 * passwordless later. Neither is implemented — both create a local mock session.
 */
const FIXTURE_CAPABILITIES: AuthCapabilities = {
  configured: false,
  methods: [
    {
      id: MOCK_GOOGLE_METHOD_ID,
      kind: 'oauth',
      label: 'Continue with Google',
      hint: 'Google sign-in is not wired up yet. This creates a local session.',
    },
    {
      id: MOCK_EMAIL_METHOD_ID,
      kind: 'email_link',
      label: 'Continue with email',
      hint: 'Passwordless email sign-in is planned. This creates a local session for now.',
    },
  ],
};

export function createFixtureAuth(
  options: {
    session?: AuthSession | null;
    /** Simulate a session that cannot be resolved, for the intentional states. */
    failGetSession?: AuthErrorCode;
  } = {},
): AuthService {
  let session: AuthSession | null = options.session ?? null;

  return {
    async getCapabilities() {
      return FIXTURE_CAPABILITIES;
    },

    async getSession() {
      if (options.failGetSession === 'expired') {
        throw new AuthError('expired', 'Your session expired.');
      }
      if (options.failGetSession === 'unavailable') {
        throw new AuthError('unavailable', 'Sign-in is unavailable right now.');
      }
      return session;
    },

    async signIn(methodId) {
      if (!FIXTURE_CAPABILITIES.methods.some((m) => m.id === methodId)) {
        throw new Error(`Unknown sign-in method: ${methodId}`);
      }
      session = {
        userId: 'user-fixture',
        email: 'parent@example.com',
        displayName: 'Demo parent',
      };
      return session;
    },

    async signOut() {
      session = null;
    },
  };
}
