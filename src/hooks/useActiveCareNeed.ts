import { useMemo } from 'react';
import type { CareNeed } from '../domain/types';
import { useService } from '../services/ServiceContext';
import { useAsync } from './useAsync';

export interface ActiveCareNeed {
  status: 'loading' | 'ready' | 'error';
  careNeed: CareNeed | null;
  error?: Error;
}

/**
 * Resolves the care search a product surface should open by default. The fixture
 * adapter returns the seeded demo need; the real backend adapter will return the
 * signed-in user's saved care search. Screens must never hardcode a need id.
 */
export function useActiveCareNeed(): ActiveCareNeed {
  const service = useService();
  const state = useAsync(() => service.getActiveCareNeed(), [service]);

  return useMemo(() => {
    if (state.status === 'ready') {
      return { status: 'ready' as const, careNeed: state.data };
    }
    if (state.status === 'error') {
      return { status: 'error' as const, careNeed: null, error: state.error };
    }
    return { status: 'loading' as const, careNeed: null };
  }, [state]);
}
