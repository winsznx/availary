import type { CalleRecipientResult } from '../calle/schema';
import type { TranscriptTurn } from '../../shared/types';
import { classifyObservation, nullResultClassification } from './classify';

function baseResult(overrides: Partial<CalleRecipientResult> = {}): CalleRecipientResult {
  return {
    willing_to_answer: 'yes',
    availability_state: 'unknown',
    age_band_fit: 'unknown',
    schedule_fit: 'unknown',
    full_time_fit: 'unknown',
    waitlist_open: 'unknown',
    tour_available: 'unknown',
    opening_window_text: '',
    days_available: [],
    availability_evidence: '',
    age_band_evidence: '',
    schedule_evidence: '',
    waitlist_evidence: '',
    tour_evidence: '',
    provider_notes: '',
    ...overrides,
  };
}

const userSays = (text: string): TranscriptTurn[] => [{ speaker: 'user', text }];

test('no extracted result at all classifies as UNKNOWN and is never promotable', () => {
  // #given a call that produced no result (e.g. unreached)
  // #when classifying
  // #then it is UNKNOWN, not NO_FIT and not inferred availability
  expect(nullResultClassification()).toMatchObject({ state: 'UNKNOWN', promotable: false });
});

test('the recipient declining to answer classifies as REFUSED, not unavailable', () => {
  const result = baseResult({ willing_to_answer: 'no' });
  expect(classifyObservation(result, []).state).toBe('REFUSED');
});

test('an open-now claim without verified transcript evidence cannot promote', () => {
  // #given CALL-E claims open_now but the evidence quote is not in the transcript
  const result = baseResult({
    availability_state: 'open_now',
    age_band_fit: 'yes',
    schedule_fit: 'full',
    availability_evidence: 'we have a spot right now',
    age_band_evidence: 'yes that age works',
    schedule_evidence: 'those days work',
  });
  // #when the transcript does not actually contain that quote
  const classification = classifyObservation(result, userSays('nothing relevant was said'));
  // #then it fails closed to UNKNOWN — unknown beats inference
  expect(classification.state).toBe('UNKNOWN');
  expect(classification.promotable).toBe(false);
});

test('an open-now claim WITH verified evidence promotes', () => {
  const result = baseResult({
    availability_state: 'open_now',
    age_band_fit: 'yes',
    schedule_fit: 'full',
    availability_evidence: 'we have a spot right now',
    age_band_evidence: 'that age works fine',
    schedule_evidence: 'those days work',
  });
  const transcript = userSays(
    'We have a spot right now, that age works fine and those days work for us.',
  );
  const classification = classifyObservation(result, transcript);
  expect(classification.state).toBe('OPEN_NOW');
  expect(classification.promotable).toBe(true);
});

test('a hard "no" on age fit overrides any claimed opening', () => {
  // #given availability looks open, but the age band is a hard no
  const result = baseResult({
    availability_state: 'open_now',
    age_band_fit: 'no',
    age_band_evidence: 'we only take children over three',
  });
  const classification = classifyObservation(
    result,
    userSays('we only take children over three'),
  );
  // #then NO_FIT wins, regardless of the availability claim
  expect(classification.state).toBe('NO_FIT');
});

test('partial weekday coverage classifies as PARTIAL_FIT', () => {
  const result = baseResult({ schedule_fit: 'partial', age_band_fit: 'yes' });
  expect(classifyObservation(result, []).state).toBe('PARTIAL_FIT');
});

test('a future opening with verified evidence classifies as EXPECTED_OPENING', () => {
  const result = baseResult({
    availability_state: 'expected_future',
    age_band_fit: 'yes',
    opening_window_text: 'early November',
    availability_evidence: 'we expect a spot to open in early November',
  });
  const transcript = userSays('We expect a spot to open in early November for that age.');
  const classification = classifyObservation(result, transcript);
  expect(classification.state).toBe('EXPECTED_OPENING');
  expect(classification.promotable).toBe(true);
});

test('a future opening claim without evidence fails closed to UNKNOWN', () => {
  const result = baseResult({
    availability_state: 'expected_future',
    age_band_fit: 'yes',
    opening_window_text: 'early November',
    availability_evidence: 'we expect a spot to open in early November',
  });
  const classification = classifyObservation(result, userSays('nothing relevant was said'));
  expect(classification.state).toBe('UNKNOWN');
  expect(classification.promotable).toBe(false);
});
