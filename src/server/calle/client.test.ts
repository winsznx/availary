import { createCalleClient, CalleRequestError } from './client';

const baseUrl = 'https://api.heycall-e.test';

function mockFetchOnce(response: { status: number; body: unknown }) {
  return vi.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: async () => response.body,
  });
}

test('createCall sends the caller-supplied idempotency key, never inventing one', async () => {
  // #given a client and a persisted idempotency key
  const fetchMock = mockFetchOnce({ status: 200, body: { call_id: 'call-1', status: 'queued' } });
  vi.stubGlobal('fetch', fetchMock);
  const client = createCalleClient({ apiKey: 'secret', baseUrl });

  // #when creating a call, and retrying with the same key
  await client.createCall(
    { task: 't', recipients: [], recipient_result_schema: {} },
    'availary:user-1:intent-1',
  );
  await client.createCall(
    { task: 't', recipients: [], recipient_result_schema: {} },
    'availary:user-1:intent-1',
  );

  // #then both requests carried the identical Idempotency-Key header
  const headers = fetchMock.mock.calls.map(
    (call: unknown[]) => ((call[1] as RequestInit).headers as Record<string, string>)['Idempotency-Key'],
  );
  expect(headers).toEqual(['availary:user-1:intent-1', 'availary:user-1:intent-1']);
  vi.unstubAllGlobals();
});

test('a non-ok response throws CalleRequestError carrying the status', async () => {
  vi.stubGlobal('fetch', mockFetchOnce({ status: 503, body: {} }));
  const client = createCalleClient({ apiKey: 'secret', baseUrl });

  await expect(
    client.createCall({ task: 't', recipients: [], recipient_result_schema: {} }, 'key-1'),
  ).rejects.toBeInstanceOf(CalleRequestError);
  vi.unstubAllGlobals();
});
