import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FreshnessIndicator } from '../components/FreshnessIndicator';
import { StateLabel } from '../components/StateLabel';
import { RADAR_PATH } from '../domain/routes';
import type { ConsentBasis } from '../domain/types';
import { useActiveCareNeed } from '../hooks/useActiveCareNeed';
import { useAsync } from '../hooks/useAsync';
import { useRecheck } from '../hooks/useRecheck';
import { useService } from '../services/ServiceContext';
import { useAuth } from '../services/auth/AuthContext';

const CONSENT_OPTIONS: { value: ConsentBasis; label: string }[] = [
  { value: 'owned_test_number', label: 'Test number owned by Availary' },
  { value: 'explicit_provider_consent', label: 'Explicit provider consent' },
  { value: 'production_legal_basis', label: 'Production legal basis' },
];

/**
 * Providers shortlist: flat structured rows, not cards. Providers come from the
 * service adapter; nothing is fabricated here.
 */
export function ProvidersScreen() {
  const service = useService();
  const recheck = useRecheck();
  const navigate = useNavigate();
  const { session } = useAuth();
  const active = useActiveCareNeed();
  const careNeedId = active.careNeed?.id;
  const now = useMemo(() => service.clock(), [service]);
  const [version, setVersion] = useState(0);
  const state = useAsync(
    () => (careNeedId ? service.getRadar(careNeedId) : Promise.resolve(null)),
    [service, careNeedId, version],
  );

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('GB');
  const [consentBasis, setConsentBasis] =
    useState<ConsentBasis>('explicit_provider_consent');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const addProvider = async (event: FormEvent) => {
    event.preventDefault();
    const found: string[] = [];
    if (!name.trim()) found.push('Enter a provider name.');
    const digits = phone.replace(/[\s-]/g, '');
    if (!/^\+\d{6,15}$/.test(digits)) {
      found.push('Enter a phone number in international format, e.g. +441234567890.');
    }
    if (!region.trim()) found.push('Enter a region.');
    setErrors(found);
    if (found.length > 0) return;

    setBusy(true);
    try {
      await service.addProvider({
        displayName: name.trim(),
        phone: digits,
        region: region.trim().toUpperCase(),
        locale: 'en-GB',
        consentBasis,
      });
      setName('');
      setPhone('');
      setShowForm(false);
      setVersion((v) => v + 1);
    } finally {
      setBusy(false);
    }
  };

  /**
   * The sign-in gate: the user builds their shortlist first, and only signs in
   * when they are about to save that work and open their persistent Radar.
   */
  const openRadar = () => {
    if (session) {
      navigate(RADAR_PATH);
    } else {
      navigate('/signin', { state: { from: RADAR_PATH } });
    }
  };

  return (
    <div className="screen providers">
      <header className="providers__head">
        <div>
          <h1 className="providers__title">Providers</h1>
          <p className="muted">
            The providers you are already considering. Availary does not search
            for or discover providers.
          </p>
          {!session ? (
            <p className="providers__note">
              Build your shortlist first. You will only be asked to sign in when
              you are ready to save it and open your Radar.
            </p>
          ) : null}
        </div>
        <div className="providers__head-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setShowForm((open) => !open)}
          >
            {showForm ? 'Cancel' : 'Add provider'}
          </button>
          <button type="button" className="btn btn--primary" onClick={openRadar}>
            {session ? 'Open my Radar' : 'Save and open my Radar'}
          </button>
        </div>
      </header>

      {showForm ? (
        <form className="providers__form" onSubmit={(e) => void addProvider(e)}>
          <div className="field">
            <label htmlFor="provider-name">Provider name</label>
            <input
              id="provider-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="provider-phone">Phone (international format)</label>
            <input
              id="provider-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+441234567890"
            />
          </div>
          <div className="field">
            <label htmlFor="provider-region">Region</label>
            <input
              id="provider-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="provider-consent">Consent basis</label>
            <select
              id="provider-consent"
              value={consentBasis}
              onChange={(e) => setConsentBasis(e.target.value as ConsentBasis)}
            >
              {CONSENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {errors.length > 0 ? (
            <ul className="error-note" role="alert">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Adding…' : 'Add provider'}
          </button>
        </form>
      ) : null}

      {state.status === 'loading' ? <p className="muted">Loading providers…</p> : null}
      {state.status === 'error' ? (
        <p className="error-note" role="alert">
          Could not load providers.
        </p>
      ) : null}

      {state.status === 'ready' && state.data ? (
        <ul className="provider-list">
          {state.data.entries.map((entry) => {
            const detailHref = careNeedId
              ? `/providers/${entry.provider.id}?need=${careNeedId}`
              : `/providers/${entry.provider.id}`;
            return (
              <li key={entry.provider.id} className="provider-row">
                <div className="provider-row__main">
                  <Link to={detailHref} className="provider-row__name">
                    {entry.provider.displayName}
                  </Link>
                  <span className="provider-row__phone tabular">
                    {entry.provider.maskedPhone}
                  </span>
                  <span className="provider-row__region">{entry.provider.region}</span>
                </div>
                <div className="provider-row__state">
                  <StateLabel state={entry.latest ? entry.latest.state : 'NOT_CHECKED'} />
                  <FreshnessIndicator
                    freshness={entry.freshness}
                    observedAt={entry.latest?.observedAt}
                    now={now}
                    recheck={entry.recheckAllowed}
                  />
                </div>
                <div className="provider-row__actions">
                  <Link to={detailHref} className="btn btn--small btn--ghost">
                    View
                  </Link>
                  {entry.recheckAllowed && careNeedId ? (
                    <button
                      type="button"
                      className="btn btn--small"
                      onClick={() => void recheck(entry.provider.id, careNeedId)}
                    >
                      Check availability
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
