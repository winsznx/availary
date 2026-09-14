import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useService } from '../services/ServiceContext';

/**
 * Recheck entry point. A recheck NEVER dials directly: it creates a
 * side-effect-free preview and routes to the call preview surface, where the
 * user must explicitly approve with `Place one call`.
 */
export function useRecheck() {
  const service = useService();
  const navigate = useNavigate();

  return useCallback(
    async (providerId: string, careNeedId: string) => {
      const run = await service.previewProviderCall(providerId, careNeedId);
      navigate(`/calls/${run.id}`);
    },
    [service, navigate],
  );
}
