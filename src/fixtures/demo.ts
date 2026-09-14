import type {
  CapacityObservation,
  CareNeed,
  EvidenceItem,
  Provider,
} from '../domain/types';

/**
 * Synthetic demo data (PRD §19). Always rendered with a "Demo data" label.
 * No fake customers, traction, reviews, partnerships or production metrics.
 *
 * The demo clock is pinned so the seeded Fresh / Aging / Stale mix is stable
 * for judges and screenshots. Real adapters use the actual current time.
 */
export const DEMO_CLOCK_ISO = '2026-09-13T09:00:00Z';

/** PRD-defined demo care need: 11 months at start, 2 Nov, Mon–Fri, full-time. */
export const demoCareNeed: CareNeed = {
  id: 'need-demo',
  label: 'November start · Mon to Fri · full day',
  ageAtStartMonths: 11,
  desiredStartDate: '2026-11-02',
  flexibilityDays: 14,
  weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  scheduleMode: 'FULL_TIME',
  locationLabel: 'Leeds',
  createdAt: '2026-09-01T09:00:00Z',
};

export const demoProviders: Provider[] = [
  {
    id: 'little-sprouts',
    displayName: 'Little Sprouts',
    maskedPhone: '+44 · · · · · · 238',
    region: 'GB',
    locale: 'en-GB',
    consentBasis: 'explicit_provider_consent',
    doNotContact: false,
    createdAt: '2026-09-01T09:05:00Z',
  },
  {
    id: 'bright-house',
    displayName: 'Bright House',
    maskedPhone: '+44 · · · · · · 914',
    region: 'GB',
    locale: 'en-GB',
    consentBasis: 'explicit_provider_consent',
    doNotContact: false,
    createdAt: '2026-09-01T09:06:00Z',
  },
  {
    id: 'oak-tree',
    displayName: 'Oak Tree',
    maskedPhone: '+44 · · · · · · 507',
    region: 'GB',
    locale: 'en-GB',
    consentBasis: 'explicit_provider_consent',
    doNotContact: false,
    createdAt: '2026-09-01T09:07:00Z',
  },
  {
    id: 'tiny-steps',
    displayName: 'Tiny Steps',
    maskedPhone: '+44 · · · · · · 342',
    region: 'GB',
    locale: 'en-GB',
    consentBasis: 'explicit_provider_consent',
    doNotContact: false,
    createdAt: '2026-09-01T09:08:00Z',
  },
];

export const demoObservations: CapacityObservation[] = [
  // Little Sprouts: WAITLIST_ONLY -> EXPECTED_OPENING
  {
    id: 'obs-ls-1',
    providerId: 'little-sprouts',
    careNeedId: 'need-demo',
    state: 'WAITLIST_ONLY',
    ageBandFit: 'yes',
    scheduleFit: 'unknown',
    fullTimeFit: 'unknown',
    waitlistOpen: 'yes',
    tourAvailable: 'unknown',
    weekdaysAvailable: [],
    earliestOpeningText: '',
    evidenceQuality: 0.6,
    promotable: true,
    observedAt: '2026-09-06T14:10:00Z',
    freshUntil: '2026-09-13T14:10:00Z',
  },
  {
    id: 'obs-ls-2',
    providerId: 'little-sprouts',
    careNeedId: 'need-demo',
    state: 'EXPECTED_OPENING',
    ageBandFit: 'yes',
    scheduleFit: 'full',
    fullTimeFit: 'yes',
    waitlistOpen: 'yes',
    tourAvailable: 'yes',
    weekdaysAvailable: ['mon', 'tue', 'wed', 'thu', 'fri'],
    earliestOpeningText: 'early November',
    evidenceQuality: 0.9,
    promotable: true,
    observedAt: '2026-09-12T15:20:00Z',
    freshUntil: '2026-09-19T15:20:00Z',
    supersedesObservationId: 'obs-ls-1',
  },

  // Bright House: PARTIAL_FIT (Tue/Thu only) -> Aging
  {
    id: 'obs-bh-1',
    providerId: 'bright-house',
    careNeedId: 'need-demo',
    state: 'PARTIAL_FIT',
    ageBandFit: 'yes',
    scheduleFit: 'partial',
    fullTimeFit: 'no',
    waitlistOpen: 'yes',
    tourAvailable: 'unknown',
    weekdaysAvailable: ['tue', 'thu'],
    earliestOpeningText: '',
    evidenceQuality: 0.8,
    promotable: true,
    observedAt: '2026-09-06T10:00:00Z',
    freshUntil: '2026-09-11T10:00:00Z',
  },

  // Oak Tree: UNKNOWN from insufficient evidence -> Stale / Needs recheck
  {
    id: 'obs-ot-1',
    providerId: 'oak-tree',
    careNeedId: 'need-demo',
    state: 'UNKNOWN',
    ageBandFit: 'unknown',
    scheduleFit: 'unknown',
    fullTimeFit: 'unknown',
    waitlistOpen: 'unknown',
    tourAvailable: 'unknown',
    weekdaysAvailable: [],
    earliestOpeningText: '',
    evidenceQuality: 0.2,
    promotable: false,
    observedAt: '2026-09-02T16:00:00Z',
    freshUntil: '2026-09-06T16:00:00Z',
  },

  // Tiny Steps: OPEN_NOW
  {
    id: 'obs-ts-1',
    providerId: 'tiny-steps',
    careNeedId: 'need-demo',
    state: 'OPEN_NOW',
    ageBandFit: 'yes',
    scheduleFit: 'full',
    fullTimeFit: 'yes',
    waitlistOpen: 'no',
    tourAvailable: 'yes',
    weekdaysAvailable: ['mon', 'tue', 'wed', 'thu', 'fri'],
    earliestOpeningText: '',
    evidenceQuality: 0.92,
    promotable: true,
    observedAt: '2026-09-12T11:30:00Z',
    freshUntil: '2026-09-19T11:30:00Z',
  },
];

export const demoEvidence: EvidenceItem[] = [
  {
    id: 'ev-ls-2-availability',
    observationId: 'obs-ls-2',
    fieldName: 'availability_state',
    quote: 'We should have a place open up in early November.',
    source: 'phone_call',
    verifiedInTranscript: true,
    observedAt: '2026-09-12T15:20:00Z',
  },
  {
    id: 'ev-ls-2-opening',
    observationId: 'obs-ls-2',
    fieldName: 'opening_window',
    quote: 'early November',
    source: 'phone_call',
    verifiedInTranscript: true,
    observedAt: '2026-09-12T15:20:00Z',
  },
  {
    id: 'ev-ts-1-availability',
    observationId: 'obs-ts-1',
    fieldName: 'availability_state',
    quote: 'Yes, we have a full-time space available right now.',
    source: 'phone_call',
    verifiedInTranscript: true,
    observedAt: '2026-09-12T11:30:00Z',
  },
  {
    id: 'ev-bh-1-schedule',
    observationId: 'obs-bh-1',
    fieldName: 'schedule_fit',
    quote: 'We could only offer Tuesday and Thursday at the moment.',
    source: 'phone_call',
    verifiedInTranscript: true,
    observedAt: '2026-09-06T10:00:00Z',
  },
  {
    id: 'ev-ot-1-availability',
    observationId: 'obs-ot-1',
    fieldName: 'availability_state',
    quote: 'I am not sure, you would need to speak with the manager.',
    source: 'phone_call',
    verifiedInTranscript: false,
    observedAt: '2026-09-02T16:00:00Z',
  },
];
