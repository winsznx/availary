import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ProviderDetail } from '../components/ProviderDetail';
import { Radar } from '../components/Radar';
import { StubScreen } from '../components/StubScreen';
import { RADAR_PATH } from '../domain/routes';
import { useActiveCareNeed } from '../hooks/useActiveCareNeed';
import { useAsync } from '../hooks/useAsync';
import { useRecheck } from '../hooks/useRecheck';
import { useService } from '../services/ServiceContext';

/**
 * `/providers/:providerId?need=:careNeedId` — a real, linkable product surface.
 * The Radar renders behind a right-side drawer (desktop) or full-height sheet
 * (mobile), so the state is refresh-safe and shareable.
 */
export function ProviderDetailScreen() {
  const service = useService();
  const navigate = useNavigate();
  const recheck = useRecheck();
  const { providerId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const active = useActiveCareNeed();
  const now = useMemo(() => service.clock(), [service]);
  const [version, setVersion] = useState(0);

  const careNeedId = searchParams.get('need') ?? active.careNeed?.id;
  const state = useAsync(
    () => (careNeedId ? service.getRadar(careNeedId) : Promise.resolve(null)),
    [service, careNeedId, version],
  );

  const toggleDoNotContact = async (next: boolean) => {
    await service.setDoNotContact(providerId, next);
    setVersion((v) => v + 1);
  };

  if (active.status === 'loading' || state.status === 'loading') {
    return <p className="muted">Loading provider…</p>;
  }

  if (state.status === 'error' || !state.data) {
    return (
      <StubScreen
        title="Provider unavailable"
        note="This provider could not be loaded. Return to the Radar and try again."
      />
    );
  }

  const entry = state.data.entries.find((e) => e.provider.id === providerId);

  return (
    <div className="screen">
      <Radar
        radar={state.data}
        now={now}
        onRecheck={(id) => careNeedId && void recheck(id, careNeedId)}
      />
      {entry && careNeedId ? (
        <ProviderDetail
          entry={entry}
          now={now}
          onClose={() => navigate(RADAR_PATH)}
          onRecheck={() => void recheck(providerId, careNeedId)}
          onToggleDoNotContact={(next) => void toggleDoNotContact(next)}
        />
      ) : (
        <StubScreen
          title="Provider not found"
          note="That provider is not part of this shortlist."
        />
      )}
    </div>
  );
}
