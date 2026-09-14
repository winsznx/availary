import { PROGRESS_SEQUENCE } from '../domain/callCopy';
import { computeFreshness, needsRecheck } from '../domain/freshness';
import type {
  CallExecutionState,
  CallRunView,
  CapacityObservation,
  CareNeed,
  EvidenceItem,
  Provider,
  Radar,
  RadarEntry,
} from '../domain/types';
import {
  DEMO_CLOCK_ISO,
  demoCareNeed,
  demoEvidence,
  demoObservations,
  demoProviders,
} from '../fixtures/demo';
import type { AvailabilityService, NewProviderInput } from './types';

const clone = <T>(value: T): T => structuredClone(value);

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface FixtureServiceOptions {
  /** Clock the fixture world observes. Defaults to the pinned demo clock. */
  now?: () => Date;
  /** Delay between simulated call states. Tests pass 0. */
  stepMs?: number;
  /**
   * Deterministic per-provider call outcome. Fixture simulation only — this is
   * how the demo truthfully shows alternates such as an unreached call without
   * pretending every call succeeds.
   */
  outcomes?: Partial<Record<string, CallExecutionState>>;
}

interface InternalRun {
  id: string;
  providerId: string;
  careNeedId: string;
  state: CallExecutionState;
  createdAt: string;
  updatedAt: string;
  placed: boolean;
  observationId?: string;
}

/**
 * Fixture implementation of the Availary service contract. The only source of
 * app data until the real backend exists. It never dials anything, never claims
 * a live result, and never marks a provider OPEN_NOW from a simulated call.
 */
export function createFixtureService(
  options: FixtureServiceOptions = {},
): AvailabilityService {
  const now = options.now ?? (() => new Date(DEMO_CLOCK_ISO));
  const stepMs = options.stepMs ?? 250;
  const outcomes: Partial<Record<string, CallExecutionState>> = {
    // Bright House is stale and recheckable; an unreached call is a truthful
    // alternate so the demo never implies every call succeeds.
    'bright-house': 'UNREACHED',
    ...options.outcomes,
  };

  const careNeeds: CareNeed[] = [clone(demoCareNeed)];
  const providers: Provider[] = clone(demoProviders);
  const observations: CapacityObservation[] = clone(demoObservations);
  const evidence: EvidenceItem[] = clone(demoEvidence);
  const runs = new Map<string, InternalRun>();

  let runSeq = 0;
  let obsSeq = 0;

  const providerOf = (id: string): Provider => {
    const provider = providers.find((p) => p.id === id);
    if (!provider) throw new Error(`Unknown provider: ${id}`);
    return provider;
  };

  const careNeedOf = (id: string): CareNeed => {
    const careNeed = careNeeds.find((c) => c.id === id);
    if (!careNeed) throw new Error(`Unknown care need: ${id}`);
    return careNeed;
  };

  const toView = (run: InternalRun): CallRunView => ({
    id: run.id,
    providerId: run.providerId,
    careNeedId: run.careNeedId,
    state: run.state,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    placed: run.placed,
    observationId: run.observationId,
    provider: clone(providerOf(run.providerId)),
    careNeed: clone(careNeedOf(run.careNeedId)),
  });

  const latestFor = (
    providerId: string,
    careNeedId: string,
  ): CapacityObservation | null => {
    const matches = observations
      .filter((o) => o.providerId === providerId && o.careNeedId === careNeedId)
      .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    return matches.length ? matches[matches.length - 1] : null;
  };

  const recordObservation = (run: InternalRun): CapacityObservation => {
    const at = now().toISOString();
    const freshUntil = new Date(now().getTime() + 7 * 86_400_000).toISOString();
    const previous = latestFor(run.providerId, run.careNeedId);
    const careNeed = careNeedOf(run.careNeedId);

    obsSeq += 1;
    const observation: CapacityObservation = {
      id: `obs-call-${obsSeq}`,
      providerId: run.providerId,
      careNeedId: run.careNeedId,
      // A simulated call establishes an expected opening at most — never OPEN_NOW.
      state: 'EXPECTED_OPENING',
      ageBandFit: 'yes',
      scheduleFit: 'full',
      fullTimeFit: 'yes',
      waitlistOpen: 'unknown',
      tourAvailable: 'unknown',
      weekdaysAvailable: [...careNeed.weekdays],
      earliestOpeningText: 'early November',
      evidenceQuality: 0.85,
      promotable: true,
      observedAt: at,
      freshUntil,
      supersedesObservationId: previous?.id,
    };
    observations.push(observation);

    evidence.push({
      id: `ev-call-${obsSeq}`,
      observationId: observation.id,
      fieldName: 'availability_state',
      quote: 'We may have a place opening up for that age around then.',
      source: 'phone_call',
      verifiedInTranscript: true,
      observedAt: at,
    });

    return observation;
  };

  return {
    isFixture: true,

    clock: () => now(),

    async getActiveCareNeed() {
      return clone(careNeeds.at(-1) ?? null);
    },

    async listCareNeeds() {
      return clone(careNeeds);
    },

    async getCareNeed(id) {
      return clone(careNeeds.find((c) => c.id === id) ?? null);
    },

    async createCareNeed(input) {
      const created: CareNeed = {
        ...clone(input),
        id: `need-${careNeeds.length + 1}`,
        createdAt: now().toISOString(),
      };
      careNeeds.push(created);
      return clone(created);
    },

    async listProviders() {
      return clone(providers);
    },

    async getProvider(id) {
      return clone(providers.find((p) => p.id === id) ?? null);
    },

    async addProvider(input: NewProviderInput) {
      const created: Provider = {
        id: `provider-${providers.length + 1}`,
        displayName: input.displayName,
        maskedPhone: maskPhone(input.phone),
        region: input.region,
        locale: input.locale,
        consentBasis: input.consentBasis,
        doNotContact: false,
        createdAt: now().toISOString(),
      };
      providers.push(created);
      return clone(created);
    },

    async setDoNotContact(providerId, value) {
      const provider = providerOf(providerId);
      provider.doNotContact = value;
      return clone(provider);
    },

    async getProviderHistory(providerId, careNeedId) {
      return clone(
        observations
          .filter(
            (o) => o.providerId === providerId && o.careNeedId === careNeedId,
          )
          .sort((a, b) => a.observedAt.localeCompare(b.observedAt)),
      );
    },

    async getObservationEvidence(observationId) {
      return clone(evidence.filter((e) => e.observationId === observationId));
    },

    async getRadar(careNeedId): Promise<Radar> {
      const careNeed = careNeedOf(careNeedId);

      const entries: RadarEntry[] = providers.map((provider) => {
        const history = observations
          .filter(
            (o) =>
              o.providerId === provider.id && o.careNeedId === careNeedId,
          )
          .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
        const latest = history.length ? history[history.length - 1] : null;

        return {
          provider,
          careNeed,
          latest,
          freshness: latest ? computeFreshness(latest, now()) : 'FRESH',
          history,
          recheckAllowed:
            !provider.doNotContact &&
            (!latest || needsRecheck(latest, now())),
        };
      });

      return { careNeed: clone(careNeed), entries: clone(entries) };
    },

    async previewProviderCall(providerId, careNeedId) {
      // Validate both up front: an unknown provider/need must not create a run.
      providerOf(providerId);
      careNeedOf(careNeedId);

      runSeq += 1;
      const at = now().toISOString();
      const run: InternalRun = {
        id: `run-${runSeq}`,
        providerId,
        careNeedId,
        state: 'PREVIEW',
        createdAt: at,
        updatedAt: at,
        placed: false,
      };
      runs.set(run.id, run);
      return toView(run);
    },

    async getCallRun(callRunId) {
      const run = runs.get(callRunId);
      if (!run) throw new Error(`Unknown call run: ${callRunId}`);
      return toView(run);
    },

    async placeOneCall(callRunId) {
      const run = runs.get(callRunId);
      if (!run) throw new Error(`Unknown call run: ${callRunId}`);

      // Idempotent: an already-placed run is never dialed again.
      if (run.placed) return toView(run);

      run.placed = true;
      for (const state of PROGRESS_SEQUENCE) {
        run.state = state;
        run.updatedAt = now().toISOString();
        await delay(stepMs);
      }

      const outcome = outcomes[run.providerId] ?? 'COMPLETED';
      if (outcome === 'COMPLETED') {
        const observation = recordObservation(run);
        run.observationId = observation.id;
        run.state = 'COMPLETED';
      } else {
        run.state = outcome;
      }
      run.updatedAt = now().toISOString();
      return toView(run);
    },
  };
}

/** Mask a phone number for display; the full number never reaches the client. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const last3 = digits.slice(-3);
  return `+44 · · · · · · ${last3}`;
}
