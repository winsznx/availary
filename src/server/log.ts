/**
 * Structured logging. Only identifiers — never secrets, never full
 * transcripts, never raw phone numbers.
 */
export interface LogFields {
  requestId?: string;
  userId?: string;
  careNeedId?: string;
  providerId?: string;
  callIntentId?: string;
  calleCallId?: string;
  executionStatus?: string;
  [key: string]: string | undefined;
}

export function logEvent(event: string, fields: LogFields = {}): void {
  console.log(JSON.stringify({ event, ...fields, ts: new Date().toISOString() }));
}
