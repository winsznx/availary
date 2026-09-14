import type {
  CapacityObservation,
  CallRunView,
  CareNeed,
  ConsentBasis,
  EvidenceItem,
  Provider,
  Radar,
} from '../domain/types';

export interface NewProviderInput {
  displayName: string;
  /** Full E.164 number, only ever held by the adapter/backend — never rendered. */
  phone: string;
  region: string;
  locale: string;
  consentBasis: ConsentBasis;
}

/**
 * The single frontend-facing contract. Both the fixture adapter (now) and the
 * real Availary backend adapter (later) implement this interface, so screens and
 * components never change when the backend arrives.
 *
 * Call placement / approval operations are added in Phase 2.
 */
export interface AvailabilityService {
  /** True while the app is running on synthetic fixtures. */
  readonly isFixture: boolean;

  /**
   * The data source's notion of "now". The fixture adapter returns its pinned
   * demo clock; the real backend adapter returns the actual current time.
   * Freshness must always be derived from this, never from a hardcoded clock.
   */
  clock(): Date;

  /** The care search that product surfaces should open by default. */
  getActiveCareNeed(): Promise<CareNeed | null>;

  listCareNeeds(): Promise<CareNeed[]>;
  getCareNeed(id: string): Promise<CareNeed | null>;
  createCareNeed(input: Omit<CareNeed, 'id' | 'createdAt'>): Promise<CareNeed>;

  listProviders(): Promise<Provider[]>;
  getProvider(id: string): Promise<Provider | null>;
  addProvider(input: NewProviderInput): Promise<Provider>;
  setDoNotContact(providerId: string, value: boolean): Promise<Provider>;

  getProviderHistory(
    providerId: string,
    careNeedId: string,
  ): Promise<CapacityObservation[]>;
  getObservationEvidence(observationId: string): Promise<EvidenceItem[]>;

  getRadar(careNeedId: string): Promise<Radar>;

  /**
   * Side-effect-free preview. Creates an addressable call run in state PREVIEW;
   * nothing is dialed and no remote call is created.
   */
  previewProviderCall(
    providerId: string,
    careNeedId: string,
  ): Promise<CallRunView>;

  getCallRun(callRunId: string): Promise<CallRunView>;

  /**
   * Places exactly one call for a previewed run. Idempotent: calling it again
   * for an already-placed run returns the current state and never redials.
   */
  placeOneCall(callRunId: string): Promise<CallRunView>;
}
