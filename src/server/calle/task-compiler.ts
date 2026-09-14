import type { CareNeed } from '../../domain/types';
import { CALLE_RECIPIENT_RESULT_JSON_SCHEMA } from './schema';
import type { CalleTaskRequest } from './client';

export interface CompileTaskInput {
  careNeed: CareNeed;
  providerDisplayName: string;
  providerPhoneE164: string;
  providerRegion: string;
  providerLocale: string;
  callIntentId: string;
}

const SCHEDULE_MODE_LABEL: Record<CareNeed['scheduleMode'], string> = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  FLEXIBLE: 'flexible',
};

/**
 * Builds the CALL-E task strictly from validated `CareNeed` fields. The
 * frontend never supplies a task string directly — this is the only place a
 * task is constructed. Only the information a provider needs to answer
 * availability questions is included; `CareNeed` carries no child name,
 * birth date, address or health data by construction (see domain/types.ts),
 * so there is nothing sensitive here to accidentally leak.
 */
export function compileCallTask(input: CompileTaskInput): CalleTaskRequest {
  const { careNeed } = input;
  const weekdays = careNeed.weekdays.join(', ');
  const scheduleLabel = SCHEDULE_MODE_LABEL[careNeed.scheduleMode];

  const task = [
    `You are calling ${input.providerDisplayName} on behalf of a parent researching childcare availability.`,
    `Ask whether they currently have, or expect to have, a ${scheduleLabel} opening for a child who will be about ${careNeed.ageAtStartMonths} months old starting around ${careNeed.desiredStartDate}${careNeed.flexibilityDays ? ` (flexible by up to ${careNeed.flexibilityDays} days)` : ''}.`,
    `Confirm whether they can accommodate these days: ${weekdays}.`,
    'Ask if a waitlist is currently open, and whether a tour or callback can be scheduled.',
    'Only report what the recipient explicitly states. Do not infer or guess. Use "unknown" for anything not clearly established.',
    'Do not ask for or record the child\'s name, birth date, address, health information, or any payment details.',
  ].join(' ');

  return {
    task,
    recipients: [
      {
        phone_e164: input.providerPhoneE164,
        region: input.providerRegion,
        locale: input.providerLocale,
      },
    ],
    recipient_result_schema: CALLE_RECIPIENT_RESULT_JSON_SCHEMA,
    metadata: {
      availary_call_intent_id: input.callIntentId,
    },
  };
}
