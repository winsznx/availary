/**
 * Auth boundary — provider-agnostic and deliberately NOT finalised.
 *
 * The locked UX presents Google (primary) and email (secondary, to become
 * passwordless later) as visual options, but nothing is hard-wired: the UI
 * renders whatever methods this boundary reports. Google OAuth, Supabase and
 * real magic-link sending are NOT implemented here; the mock only creates a
 * local session. The backend engineer replaces the implementation without
 * redesigning the UI.
 */

export interface AuthSession {
  userId: string;
  email: string;
  displayName?: string;
}

/** Kinds the UI can present generically. */
export type AuthMethodKind = 'email_link' | 'oauth';

export interface AuthMethod {
  id: string;
  kind: AuthMethodKind;
  label: string;
  hint?: string;
}

export interface AuthCapabilities {
  /** True once a real auth provider is configured. False in the local build. */
  configured: boolean;
  methods: AuthMethod[];
}

export type AuthErrorCode = 'expired' | 'unavailable';

/** Raised when a session cannot be resolved (e.g. it expired). */
export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface AuthService {
  getCapabilities(): Promise<AuthCapabilities>;
  /** Resolves `null` when signed out; throws `AuthError` on expiry/unavailability. */
  getSession(): Promise<AuthSession | null>;
  signIn(methodId: string): Promise<AuthSession>;
  signOut(): Promise<void>;
}
