import {
  calleCallStatusSchema,
  calleCreateResponseSchema,
  type CalleCallStatus,
  type CalleCreateResponse,
} from './schema';

export interface CalleTaskRequest {
  task: string;
  recipients: Array<{ phone_e164: string; region: string; locale: string }>;
  recipient_result_schema: Record<string, unknown>;
  metadata?: Record<string, string>;
}

export interface CalleClientOptions {
  apiKey: string;
  baseUrl: string;
}

export class CalleRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'CalleRequestError';
    this.status = status;
  }
}

/**
 * Thin `fetch` wrapper over the CALL-E Developer API. Every mutating call
 * carries a caller-supplied, persisted idempotency key — this client never
 * invents one. Never logs `apiKey`.
 */
export function createCalleClient({ apiKey, baseUrl }: CalleClientOptions) {
  const headers = (idempotencyKey?: string): HeadersInit => {
    const base: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    if (idempotencyKey) base['Idempotency-Key'] = idempotencyKey;
    return base;
  };

  return {
    async createCall(
      body: CalleTaskRequest,
      idempotencyKey: string,
    ): Promise<CalleCreateResponse> {
      const response = await fetch(`${baseUrl}/v1/calls`, {
        method: 'POST',
        headers: headers(idempotencyKey),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new CalleRequestError(
          response.status,
          `CALL-E create failed with status ${response.status}`,
        );
      }

      const json = await response.json();
      return calleCreateResponseSchema.parse(json);
    },

    async getCall(callId: string): Promise<CalleCallStatus> {
      const response = await fetch(`${baseUrl}/v1/calls/${encodeURIComponent(callId)}`, {
        method: 'GET',
        headers: headers(),
      });

      if (!response.ok) {
        throw new CalleRequestError(
          response.status,
          `CALL-E status fetch failed with status ${response.status}`,
        );
      }

      const json = await response.json();
      return calleCallStatusSchema.parse(json);
    },
  };
}

export type CalleClient = ReturnType<typeof createCalleClient>;
