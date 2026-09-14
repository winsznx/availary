import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CallPreviewPanel } from '../components/CallPreviewPanel';
import { CallProgressPanel } from '../components/CallProgressPanel';
import { StubScreen } from '../components/StubScreen';
import { useCallRun } from '../hooks/useCallRun';
import { useService } from '../services/ServiceContext';

/**
 * `/calls/:callRunId` — the real call surface: preview, progress and outcome.
 * A recheck or first check always lands here in PREVIEW first; only the
 * explicit `Place one call` action places the call, and it is idempotent.
 */
export function CallScreen() {
  const service = useService();
  const navigate = useNavigate();
  const { callRunId = '' } = useParams();
  const { run, error } = useCallRun(callRunId);
  const [busy, setBusy] = useState(false);

  if (error) {
    return (
      <StubScreen
        title="Call unavailable"
        note="This call could not be loaded. Return to the Radar and try again."
      />
    );
  }

  if (!run) {
    return <p className="muted">Loading call…</p>;
  }

  const place = async () => {
    setBusy(true);
    try {
      await service.placeOneCall(run.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen screen--narrow">
      <Link to={`/radar/${run.careNeedId}`} className="back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Radar
      </Link>
      {run.state === 'PREVIEW' ? (
        <CallPreviewPanel run={run} onPlace={() => void place()} busy={busy} />
      ) : (
        <CallProgressPanel
          run={run}
          onReturn={() => navigate(`/radar/${run.careNeedId}`)}
        />
      )}
    </div>
  );
}
