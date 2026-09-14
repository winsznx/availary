import type { TranscriptTurn } from '../../shared/types';

const SMART_QUOTES: Array<[RegExp, string]> = [
  [/[‘’‛]/g, "'"],
  [/[“”‟]/g, '"'],
];

// Leading/trailing punctuation only — internal punctuation (contractions,
// mid-sentence commas) is preserved so the substring match stays exact.
const OUTER_PUNCTUATION = /^[\p{P}\s]+|[\p{P}\s]+$/gu;

/**
 * Normalization pipeline from TECHNICAL-SPEC.md "Evidence matching":
 * Unicode NFKC, lowercase, collapse whitespace, normalize smart quotes,
 * strip leading/trailing punctuation only.
 */
export function normalizeForEvidenceMatch(text: string): string {
  let normalized = text.normalize('NFKC').toLowerCase();
  for (const [pattern, replacement] of SMART_QUOTES) {
    normalized = normalized.replace(pattern, replacement);
  }
  normalized = normalized.replace(/\s+/g, ' ').trim();
  normalized = normalized.replace(OUTER_PUNCTUATION, '');
  return normalized;
}

/**
 * A critical evidence string passes only if it is a contiguous substring of
 * a recipient (`speaker === 'user'`) transcript turn after normalization. No
 * fuzzy matching in v1 — an empty quote never passes.
 */
export function evidenceVerifiedInTranscript(
  quote: string,
  transcript: TranscriptTurn[],
): boolean {
  const normalizedQuote = normalizeForEvidenceMatch(quote);
  if (!normalizedQuote) return false;

  return transcript
    .filter((turn) => turn.speaker === 'user')
    .some((turn) => normalizeForEvidenceMatch(turn.text).includes(normalizedQuote));
}
