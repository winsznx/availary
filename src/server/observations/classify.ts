import type { TranscriptTurn } from '../../shared/types';
import type { CalleRecipientResult } from '../calle/schema';
import { evidenceVerifiedInTranscript } from './validate-evidence';

export type ClassifiedState =
  | 'OPEN_NOW'
  | 'EXPECTED_OPENING'
  | 'PARTIAL_FIT'
  | 'WAITLIST_ONLY'
  | 'NO_FIT'
  | 'NO_KNOWN_OPENING'
  | 'UNKNOWN'
  | 'REFUSED';

export type EvidenceQuality = 'strong' | 'partial' | 'insufficient';

export interface ClassificationResult {
  state: ClassifiedState;
  promotable: boolean;
  evidenceQuality: EvidenceQuality;
  ageBandFit: 'yes' | 'no' | 'unknown';
  scheduleFit: 'full' | 'partial' | 'no' | 'unknown';
  fullTimeFit: 'yes' | 'no' | 'unknown';
  waitlistOpen: 'yes' | 'no' | 'unknown';
  tourAvailable: 'yes' | 'no' | 'unknown';
  earliestOpeningText: string;
}

/** The call produced no extracted result at all (e.g. unreached). Unknown beats inference. */
export function nullResultClassification(): ClassificationResult {
  return {
    state: 'UNKNOWN',
    promotable: false,
    evidenceQuality: 'insufficient',
    ageBandFit: 'unknown',
    scheduleFit: 'unknown',
    fullTimeFit: 'unknown',
    waitlistOpen: 'unknown',
    tourAvailable: 'unknown',
    earliestOpeningText: '',
  };
}

/**
 * Turns a schema-validated CALL-E result into product truth. This is
 * deliberately conservative — "unknown beats inference" (TECHNICAL-SPEC.md).
 *
 * Critical fields, per spec:
 *   OPEN_NOW        needs availability + age-band + schedule evidence.
 *   EXPECTED_OPENING needs availability + opening-window evidence, and
 *                    age_band_fit must not be explicitly "no".
 *
 * `task_completed`/confidence from CALL-E are never consulted here — a
 * completed call is not an opening, and confidence is not proof. Only
 * verbatim, transcript-verified evidence can promote a positive claim.
 */
export function classifyObservation(
  result: CalleRecipientResult,
  transcript: TranscriptTurn[],
): ClassificationResult {
  const base = {
    ageBandFit: result.age_band_fit,
    scheduleFit: result.schedule_fit,
    fullTimeFit: result.full_time_fit,
    waitlistOpen: result.waitlist_open,
    tourAvailable: result.tour_available,
    earliestOpeningText: result.opening_window_text,
  };

  if (result.willing_to_answer === 'no') {
    return {
      ...base,
      state: 'REFUSED',
      promotable: false,
      evidenceQuality: 'insufficient',
    };
  }

  // A hard "no" on age fit disqualifies regardless of any claimed opening —
  // reporting an opening the family cannot use would be a false positive.
  if (result.age_band_fit === 'no') {
    return {
      ...base,
      state: 'NO_FIT',
      promotable: true,
      evidenceQuality: evidenceVerifiedInTranscript(result.age_band_evidence, transcript)
        ? 'strong'
        : 'partial',
    };
  }

  if (result.schedule_fit === 'partial') {
    return {
      ...base,
      state: 'PARTIAL_FIT',
      promotable: true,
      evidenceQuality: evidenceVerifiedInTranscript(result.schedule_evidence, transcript)
        ? 'strong'
        : 'partial',
    };
  }

  if (result.availability_state === 'open_now') {
    const criticalVerified =
      evidenceVerifiedInTranscript(result.availability_evidence, transcript) &&
      evidenceVerifiedInTranscript(result.age_band_evidence, transcript) &&
      evidenceVerifiedInTranscript(result.schedule_evidence, transcript);

    if (!criticalVerified) {
      // Evidence missing => cannot promote an opening. Fail closed to unknown.
      return { ...base, state: 'UNKNOWN', promotable: false, evidenceQuality: 'insufficient' };
    }
    return { ...base, state: 'OPEN_NOW', promotable: true, evidenceQuality: 'strong' };
  }

  if (result.availability_state === 'expected_future') {
    const criticalVerified =
      evidenceVerifiedInTranscript(result.availability_evidence, transcript) &&
      result.opening_window_text.trim().length > 0;

    if (!criticalVerified) {
      return { ...base, state: 'UNKNOWN', promotable: false, evidenceQuality: 'insufficient' };
    }
    return { ...base, state: 'EXPECTED_OPENING', promotable: true, evidenceQuality: 'strong' };
  }

  if (result.availability_state === 'waitlist_only') {
    return { ...base, state: 'WAITLIST_ONLY', promotable: true, evidenceQuality: 'partial' };
  }

  if (result.availability_state === 'no_known_opening') {
    return { ...base, state: 'NO_KNOWN_OPENING', promotable: true, evidenceQuality: 'partial' };
  }

  return { ...base, state: 'UNKNOWN', promotable: false, evidenceQuality: 'insufficient' };
}
