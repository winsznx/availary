import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createFixtureAuth } from './fixtureAuth';
import {
  AuthError,
  type AuthCapabilities,
  type AuthErrorCode,
  type AuthService,
  type AuthSession,
} from './types';

const defaultAuth = createFixtureAuth();

export type AuthStatus = 'loading' | 'ready' | 'error';

interface AuthValue {
  status: AuthStatus;
  session: AuthSession | null;
  capabilities: AuthCapabilities | null;
  sessionError: AuthErrorCode | null;
  signIn: (methodId: string, input?: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Intentional session states: `loading`, `ready` (signed in or signed out) and
 * `error` (expired / unavailable). `demo` is an app mode, not a session — the
 * demo bypasses this boundary entirely.
 */
export function AuthProvider({
  service = defaultAuth,
  children,
}: {
  service?: AuthService;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [capabilities, setCapabilities] = useState<AuthCapabilities | null>(null);
  const [sessionError, setSessionError] = useState<AuthErrorCode | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setSessionError(null);

    Promise.all([service.getCapabilities(), service.getSession()])
      .then(([caps, current]) => {
        if (!alive) return;
        setCapabilities(caps);
        setSession(current);
        setStatus('ready');
      })
      .catch((cause: unknown) => {
        if (!alive) return;
        setSession(null);
        setSessionError(cause instanceof AuthError ? cause.code : 'unavailable');
        setStatus('error');
      });

    return () => {
      alive = false;
    };
  }, [service, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      session,
      capabilities,
      sessionError,
      signIn: async (methodId: string, input?: string) => {
        const next = await service.signIn(methodId, input);
        setSession(next);
        setSessionError(null);
        setStatus('ready');
        return next;
      },
      signOut: async () => {
        await service.signOut();
        setSession(null);
      },
      retry,
    }),
    [status, session, capabilities, sessionError, service, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
