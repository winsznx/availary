import { evidenceVerifiedInTranscript, normalizeForEvidenceMatch } from './validate-evidence';

test('normalization collapses whitespace, case, and smart quotes', () => {
  // #given text with mixed case, curly quotes, and irregular spacing
  // #when normalized
  // #then it matches the plain equivalent
  expect(normalizeForEvidenceMatch('  We’re   FULL right now.  ')).toBe(
    "we're full right now",
  );
});

test('an evidence quote passes only against a user-speaker transcript turn', () => {
  // #given a transcript where only the "user" (recipient) turn has the claim
  const transcript = [
    { speaker: 'agent' as const, text: 'Do you have any openings for a two year old?' },
    { speaker: 'user' as const, text: 'We have a spot opening up in November.' },
  ];
  // #when checking the exact claim against it
  // #then it verifies
  expect(evidenceVerifiedInTranscript('a spot opening up in November', transcript)).toBe(true);
});

test('an evidence quote never verifies from the agent turn or when missing', () => {
  const transcript = [
    { speaker: 'agent' as const, text: 'We have a spot opening up in November.' },
  ];
  // #then it does not verify — no fuzzy matching, no cross-speaker credit
  expect(evidenceVerifiedInTranscript('a spot opening up in November', transcript)).toBe(false);
  expect(evidenceVerifiedInTranscript('', transcript)).toBe(false);
});
