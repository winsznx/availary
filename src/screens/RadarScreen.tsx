import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Radar } from '../components/Radar';
import { StubScreen } from '../components/StubScreen';
import { RADAR_ACTIVE_TOKEN } from '../domain/routes';
import { useActiveCareNeed } from '../hooks/useActiveCareNeed';
import { useAsync } from '../hooks/useAsync';
import { useRecheck } from '../hooks/useRecheck';
import { useService } from '../services/ServiceContext';

/**
 * The main Radar. `/radar/current` resolves the active care search through the
 * service adapter; an explicit `/radar/:careNeedId` opens that care search.
 */
export function RadarScreen() {
  const service = useService();
  const recheck = useRecheck();
  const { careNeedId } = useParams();
  const active = useActiveCareNeed();
  const now = useMemo(() => service.clock(), [service]);

  const isResolver = !careNeedId || careNeedId === RADAR_ACTIVE_TOKEN;
  const resolvedId = isResolver ? active.careNeed?.id : careNeedId;

  const state = useAsync(
    () => (resolvedId ? service.getRadar(resolvedId) : Promise.resolve(null)),
    [service, resolvedId],
  );

  if (active.status === 'loading' || state.status === 'loading') {
    return <p className="muted">Loading Radar…</p>;
  }

  if (active.status === 'error' || state.status === 'error') {
    return (
      <StubScreen
        title="Radar unavailable"
        note="This care search could not be loaded. Please try again in a moment."
      />
    );
  }

  if (!resolvedId || !state.data) {
    return (
      <StubScreen
        title="No care search yet"
        note="Start a care search to build a shortlist and record availability."
      />
    );
  }

  return (
    <div className="screen">
      {service.isFixture ? (
        <p className="demo-notice">
          Demo data. Fixture observations. Availability is not live.
        </p>
      ) : null}
      <Radar
        radar={state.data}
        now={now}
        onRecheck={(id) => void recheck(id, resolvedId)}
      />
    </div>
  );
}
