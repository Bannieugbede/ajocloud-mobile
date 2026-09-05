import { ApiClient } from '@/api/client/api-client';
import type { AppError } from '@/types/errors';

const BASE = 'https://api.example.test';

/**
 * A fetch that never settles unless its signal aborts, standing in for a
 * backend that is slower than the client is willing to wait.
 */
function hangingFetch() {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(
    (_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })),
        );
      }),
  );
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
  } as unknown as Response;
}

describe('ApiClient timeouts', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('aborts a request that outlives its timeout and reports it as one', async () => {
    hangingFetch();

    const client = new ApiClient(BASE);
    const request = client.request('/slow', { timeoutMs: 10 });

    await expect(request).rejects.toMatchObject<Partial<AppError>>({ kind: 'timeout' });
  });

  it('still applies its timeout when the caller supplies a signal', async () => {
    // The caller's signal used to replace the client's, which silently disabled
    // the timeout for that request.
    hangingFetch();

    const client = new ApiClient(BASE);
    const caller = new AbortController();
    const request = client.request('/slow', { timeoutMs: 10, signal: caller.signal });

    await expect(request).rejects.toMatchObject<Partial<AppError>>({ kind: 'timeout' });
  });

  it('lets the caller abort before the timeout elapses', async () => {
    hangingFetch();

    const client = new ApiClient(BASE);
    const caller = new AbortController();
    const request = client.request('/slow', { timeoutMs: 60_000, signal: caller.signal });
    // `request` awaits the token provider before it calls fetch, so the abort has
    // to come after that microtask or the mock's listener is not yet attached.
    await Promise.resolve();
    caller.abort();

    await expect(request).rejects.toMatchObject<Partial<AppError>>({ kind: 'timeout' });
  });

  it('returns the payload when the server answers in time', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true }));

    const client = new ApiClient(BASE);
    await expect(client.request('/fast')).resolves.toEqual({ ok: true });
  });
});

describe('recovering from a rejected access token', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('refreshes and retries once when the server rejects the token', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ id: 'wallet-1' }));
    const refresh = jest.fn().mockResolvedValue('fresh-token');

    const client = new ApiClient(BASE, async () => 'stale-token', refresh);

    await expect(client.request('/wallets')).resolves.toEqual({ id: 'wallet-1' });
    expect(refresh).toHaveBeenCalledTimes(1);
    // The retry must carry the new token; sending the stale one again would
    // fail identically and burn a rotation for nothing.
    const retryHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Headers;
    expect(retryHeaders.get('Authorization')).toBe('Bearer fresh-token');
  });

  it('gives up after one retry rather than looping on a token the server keeps refusing', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ message: 'Nope' }, 401));
    const refresh = jest.fn().mockResolvedValue('fresh-token');

    const client = new ApiClient(BASE, async () => 'stale-token', refresh);

    await expect(client.request('/wallets')).rejects.toMatchObject({ kind: 'authentication' });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('surfaces the original refusal when the session cannot be refreshed', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, 401));

    const client = new ApiClient(
      BASE,
      async () => 'stale-token',
      async () => null,
    );

    await expect(client.request('/wallets')).rejects.toMatchObject({ kind: 'authentication' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not refresh on failures that are not about authentication', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ message: 'Boom' }, 500));
    const refresh = jest.fn();

    const client = new ApiClient(BASE, async () => 'token', refresh);

    await expect(client.request('/wallets')).rejects.toMatchObject({ kind: 'server' });
    expect(refresh).not.toHaveBeenCalled();
  });
});
