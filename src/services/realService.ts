import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CallRunView,
  CapacityObservation,
  CareNeed,
  EvidenceItem,
  Provider,
  Radar,
} from '../domain/types';
import {
  addDraftProvider,
  clearDraft,
  getDraft,
  setDraftCareNeed,
  updateDraftProviderDoNotContact,
  type DraftProvider,
} from './localDraft';
import type { AvailabilityService, NewProviderInput } from './types';
import { maskPhone } from './fixtureService';

export interface RealServiceOptions {
  supabase: SupabaseClient;
  apiBaseUrl: string;
}

class ApiError extends Error {}

function toDomainProvider(draft: DraftProvider): Provider {
  const { phone: _phone, ...provider } = draft;
  return provider;
}

/**
 * Real `AvailabilityService`. Pre-auth, product state lives entirely in the
 * browser (`src/services/localDraft.ts`) — nothing is sent to Supabase until
 * a session exists, at which point the draft is synced exactly once before
 * any backend call. Post-sync (and for any user who was already signed in),
 * every method talks to the Worker API directly.
 */
export function createRealService({ supabase, apiBaseUrl }: RealServiceOptions): AvailabilityService {
  let syncPromise: Promise<void> | null = null;

  async function getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function apiFetch<T>(path: string, init: RequestInit, token: string): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: response.statusText }));
      throw new ApiError((body as { error?: string }).error ?? `Request failed (${response.status})`);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  /**
   * Ensures any local draft is persisted before the first backend call once
   * a session exists. Idempotent and safe to call from every method — the
   * draft is only synced once (`syncPromise` memoizes the in-flight/settled
   * attempt), and a failure leaves the draft intact for the next attempt.
   */
  async function ensureSynced(token: string): Promise<void> {
    const draft = getDraft();
    if (!draft.careNeed) return;

    if (!syncPromise) {
      syncPromise = apiFetch<unknown>(
        '/api/care-needs/sync-draft',
        {
          method: 'POST',
          body: JSON.stringify({ careNeed: draft.careNeed, providers: draft.providers }),
        },
        token,
      )
        .then(() => {
          clearDraft();
        })
        .catch((error: unknown) => {
          // Leave the draft in place so the next call can retry the sync.
          syncPromise = null;
          throw error;
        });
    }
    await syncPromise;
  }

  /** Resolves to `null` in draft mode, or a ready access token in backend mode. */
  async function mode(): Promise<string | null> {
    const token = await getAccessToken();
    if (!token) return null;
    await ensureSynced(token);
    return token;
  }

  async function requireToken(): Promise<string> {
    const token = await mode();
    if (!token) {
      throw new Error('Sign in required for this action.');
    }
    return token;
  }

  return {
    isFixture: false,

    clock: () => new Date(),

    async getActiveCareNeed() {
      const token = await mode();
      if (!token) return getDraft().careNeed;
      return apiFetch<CareNeed | null>('/api/care-needs/active', { method: 'GET' }, token);
    },

    async listCareNeeds() {
      const token = await mode();
      if (!token) {
        const draft = getDraft().careNeed;
        return draft ? [draft] : [];
      }
      return apiFetch<CareNeed[]>('/api/care-needs', { method: 'GET' }, token);
    },

    async getCareNeed(id) {
      const token = await mode();
      if (!token) {
        const draft = getDraft().careNeed;
        return draft?.id === id ? draft : null;
      }
      return apiFetch<CareNeed | null>(`/api/care-needs/${id}`, { method: 'GET' }, token);
    },

    async createCareNeed(input) {
      const token = await mode();
      if (!token) {
        const careNeed: CareNeed = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setDraftCareNeed(careNeed);
        return careNeed;
      }
      return apiFetch<CareNeed>('/api/care-needs', { method: 'POST', body: JSON.stringify(input) }, token);
    },

    async listProviders() {
      const token = await mode();
      if (!token) return getDraft().providers.map(toDomainProvider);
      return apiFetch<Provider[]>('/api/providers', { method: 'GET' }, token);
    },

    async getProvider(id) {
      const token = await mode();
      if (!token) {
        const provider = getDraft().providers.find((p) => p.id === id);
        return provider ? toDomainProvider(provider) : null;
      }
      return apiFetch<Provider | null>(`/api/providers/${id}`, { method: 'GET' }, token);
    },

    async addProvider(input: NewProviderInput) {
      const token = await mode();
      if (!token) {
        const provider: DraftProvider = {
          id: crypto.randomUUID(),
          displayName: input.displayName,
          phone: input.phone,
          maskedPhone: maskPhone(input.phone),
          region: input.region,
          locale: input.locale,
          consentBasis: input.consentBasis,
          doNotContact: false,
          createdAt: new Date().toISOString(),
        };
        addDraftProvider(provider);
        return toDomainProvider(provider);
      }
      return apiFetch<Provider>('/api/providers', { method: 'POST', body: JSON.stringify(input) }, token);
    },

    async setDoNotContact(providerId, value) {
      const token = await mode();
      if (!token) {
        updateDraftProviderDoNotContact(providerId, value);
        const provider = getDraft().providers.find((p) => p.id === providerId);
        if (!provider) throw new Error(`Unknown provider: ${providerId}`);
        return toDomainProvider(provider);
      }
      return apiFetch<Provider>(
        `/api/providers/${providerId}/do-not-contact`,
        { method: 'POST', body: JSON.stringify({ value }) },
        token,
      );
    },

    async getProviderHistory(providerId, careNeedId) {
      const token = await mode();
      if (!token) return [];
      return apiFetch<CapacityObservation[]>(
        `/api/providers/${providerId}/history?careNeedId=${encodeURIComponent(careNeedId)}`,
        { method: 'GET' },
        token,
      );
    },

    async getObservationEvidence(observationId) {
      const token = await mode();
      if (!token) return [];
      return apiFetch<EvidenceItem[]>(`/api/observations/${observationId}/evidence`, { method: 'GET' }, token);
    },

    async getRadar(careNeedId) {
      const token = await mode();
      if (!token) {
        const draft = getDraft();
        if (!draft.careNeed) throw new Error(`Unknown care need: ${careNeedId}`);
        return {
          careNeed: draft.careNeed,
          entries: draft.providers.map((provider) => ({
            provider: toDomainProvider(provider),
            careNeed: draft.careNeed as CareNeed,
            latest: null,
            freshness: 'FRESH' as const,
            history: [],
            recheckAllowed: !provider.doNotContact,
          })),
        };
      }
      return apiFetch<Radar>(`/api/radar/${careNeedId}`, { method: 'GET' }, token);
    },

    async previewProviderCall(providerId, careNeedId) {
      const token = await requireToken();
      return apiFetch<CallRunView>(
        '/api/calls/preview',
        { method: 'POST', body: JSON.stringify({ providerId, careNeedId }) },
        token,
      );
    },

    async getCallRun(callRunId) {
      const token = await requireToken();
      return apiFetch<CallRunView>(`/api/calls/${callRunId}`, { method: 'GET' }, token);
    },

    async placeOneCall(callRunId) {
      const token = await requireToken();
      return apiFetch<CallRunView>(`/api/calls/${callRunId}/place`, { method: 'POST' }, token);
    },
  };
}
