import { useMemo } from 'react';
import { Radar } from '../components/Radar';
import { StubScreen } from '../components/StubScreen';
import { useActiveCareNeed } from '../hooks/useActiveCareNeed';
import { useAsync } from '../hooks/useAsync';
import { useRecheck } from '../hooks/useRecheck';
import { useService } from '../services/ServiceContext';

/**
 * `/demo` opens directly into a populated synthetic Radar.
 * Fixture-only: nothing here dials or claims a live result.
 */
export function DemoScreen() {
  const service = useService();
  const recheck = useRecheck();
  const active = useActiveCareNeed();
  const now = useMemo(() => service.clock(), [service]);
  const careNeedId = active.careNeed?.id;

  const state = useAsync(
    () => (careNeedId ? service.getRadar(careNeedId) : Promise.resolve(null)),
    [service, careNeedId],
  );

  if (active.status === 'loading' || state.status === 'loading') {
    return <p className="muted">Loading Radar…</p>;
  }

  if (state.status === 'error' || !careNeedId || !state.data) {
    return (
      <StubScreen
        title="Demo unavailable"
        note="The demo Radar could not be loaded. Please try again in a moment."
      />
    );
  }

  return (
    <div className="screen">
      <p className="demo-notice">
        Demo data. This Radar is populated from synthetic fixtures. No real calls
        are placed and no live availability is claimed.
      </p>
      <Radar
        radar={state.data}
        now={now}
        onRecheck={(id) => void recheck(id, careNeedId)}
      />
    </div>
  );
}
