import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AuthError,
  EmailLinkSent,
  type AuthCapabilities,
  type AuthService,
  type AuthSession,
} from './types';

export const GOOGLE_METHOD_ID = 'google';
export const EMAIL_METHOD_ID = 'email';

const CAPABILITIES: AuthCapabilities = {
  configured: true,
  methods: [
    { id: GOOGLE_METHOD_ID, kind: 'oauth', label: 'Continue with Google' },
    {
      id: EMAIL_METHOD_ID,
      kind: 'email_link',
      label: 'Continue with email',
      hint: 'We will email you a sign-in link.',
    },
  ],
};

function toSession(user: { id: string; email?: string | null }): AuthSession {
  return {
    userId: user.id,
    email: user.email ?? '',
  };
}

/**
 * Real `AuthService` implementation over Supabase Auth. `signIn('email', address)`
 * sends a magic link and returns — Supabase resolves the actual session from the
 * emailed callback landing back on `/signin`, not from this call. `SignInScreen`
 * shows a distinct "check your inbox" state for that case (see `EmailLinkSent`).
 */
export function createSupabaseAuth(client: SupabaseClient): AuthService {
  return {
    async getCapabilities() {
      return CAPABILITIES;
    },

    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error) {
        throw new AuthError('unavailable', error.message);
      }
      if (!data.session) return null;
      return toSession(data.session.user);
    },

    async signIn(methodId, input) {
      if (methodId === GOOGLE_METHOD_ID) {
        const { error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/signin` },
        });
        if (error) throw new AuthError('unavailable', error.message);
        // The browser is redirected to Google; there is no session yet.
        // Callers polling getSession() after the redirect back will see it.
        return new Promise<AuthSession>(() => {
          /* navigation away from this page follows */
        });
      }

      if (methodId === EMAIL_METHOD_ID) {
        if (!input) throw new Error('Email is required to sign in.');
        await sendEmailLink(client, input);
        throw new EmailLinkSent(input);
      }

      throw new Error(`Unknown sign-in method: ${methodId}`);
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw new AuthError('unavailable', error.message);
    },
  };
}

/** Sends a Supabase magic link that lands back on `/signin` to complete the session. */
export async function sendEmailLink(client: SupabaseClient, email: string): Promise<void> {
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/signin` },
  });
  if (error) throw new AuthError('unavailable', error.message);
}
