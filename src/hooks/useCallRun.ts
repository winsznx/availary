import { useEffect, useState } from 'react';
import { isTerminal } from '../domain/callCopy';
import type { CallRunView } from '../domain/types';
import { useService } from '../services/ServiceContext';

/**
 * Polls the call run until it reaches a terminal state. A real backend will be
 * polled the same way (PRD/TECHNICAL-SPEC: browser polls the local call route).
 */
export function useCallRun(callRunId: string, pollMs = 150) {
  const service = useService();
  const [run, setRun] = useState<CallRunView | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      service
        .getCallRun(callRunId)
        .then((next) => {
          if (!alive) return;
          setRun(next);
          if (!isTerminal(next.state)) timer = setTimeout(tick, pollMs);
        })
        .catch((cause: unknown) => {
          if (alive) {
            setError(cause instanceof Error ? cause : new Error(String(cause)));
          }
        });
    };

    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [service, callRunId, pollMs]);

  return { run, error };
}
