import { refreshSession } from '@/api/endpoints/auth-refresh';
import {
  currentAccessToken,
  refreshAccessToken,
  resetRefreshStateForTests,
} from '@/services/session-manager';
import { clearSession, restoreSession, saveSession } from '@/services/session-storage';
import type { AppError } from '@/types/errors';

jest.mock('@/api/endpoints/auth-refresh');
jest.mock('@/services/session-storage');

const LIVE = new Date(Date.now() + 15 * 60_000).toISOString();
const SPENT = new Date(Date.now() - 60_000).toISOString();

function stored(expiresAt: string, accessToken = 'old-access') {
  jest.mocked(restoreSession).mockResolvedValue({
    accessToken,
    refreshToken: 'refresh-1',
    expiresAt,
  });
}

function rotatesTo(accessToken: string, refreshToken = 'refresh-2') {
  jest.mocked(refreshSession).mockResolvedValue({
    accessToken,
    refreshToken,
    expiresIn: '15m',
    accessTokenExpiresAt: LIVE,
  });
}

function refusal(): AppError {
  return { kind: 'authentication', message: 'Refresh token is invalid' } as AppError;
}

function offline(): AppError {
  return { kind: 'network', message: 'You appear to be offline' } as AppError;
}

beforeEach(() => {
  jest.clearAllMocks();
  resetRefreshStateForTests();
  jest.mocked(restoreSession).mockResolvedValue(null);
});

describe('using the stored access token', () => {
  it('sends a token that is still good without refreshing', async () => {
    stored(LIVE, 'good-access');

    await expect(currentAccessToken()).resolves.toBe('good-access');
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('refreshes a spent token and returns the replacement', async () => {
    stored(SPENT);
    rotatesTo('new-access');

    await expect(currentAccessToken()).resolves.toBe('new-access');
    expect(refreshSession).toHaveBeenCalledWith('refresh-1');
  });

  it('refreshes a token that expires within the round-trip margin', async () => {
    // Still unexpired, but not by enough to survive the request it would be
    // sent on. Treating this as good is how a request fails for no visible
    // reason seconds after the app decided the session was fine.
    stored(new Date(Date.now() + 5_000).toISOString());
    rotatesTo('new-access');

    await expect(currentAccessToken()).resolves.toBe('new-access');
    expect(refreshSession).toHaveBeenCalled();
  });

  it('reports no token when nothing is stored', async () => {
    await expect(currentAccessToken()).resolves.toBeNull();
    expect(refreshSession).not.toHaveBeenCalled();
  });
});

describe('storing the rotated pair', () => {
  it('saves both new tokens, not just the access token', async () => {
    // The backend rotates on every refresh and rejects a token used twice. A
    // refresh that saved only the access token would leave the spent refresh
    // token on the device and end the session on the next attempt.
    stored(SPENT);
    rotatesTo('new-access', 'refresh-2');

    await refreshAccessToken();

    expect(saveSession).toHaveBeenCalledWith({
      accessToken: 'new-access',
      refreshToken: 'refresh-2',
      expiresAt: LIVE,
    });
  });
});

describe('concurrent refreshes', () => {
  it('rotates once when several requests find the token spent at the same time', async () => {
    // Rotation makes a second concurrent refresh actively destructive: the
    // backend reads the reused token as theft and marks the whole session
    // COMPROMISED, so parallel callers must share one rotation.
    stored(SPENT);
    // Held open until all three callers have arrived, so they are genuinely
    // concurrent rather than three refreshes that happened to be quick.
    let release!: () => void;
    const reached = new Promise<void>((resolve) => {
      release = resolve;
    });
    jest.mocked(refreshSession).mockImplementation(async () => {
      await reached;
      return {
        accessToken: 'new-access',
        refreshToken: 'refresh-2',
        expiresIn: '15m',
        accessTokenExpiresAt: LIVE,
      };
    });

    const all = Promise.all([currentAccessToken(), currentAccessToken(), currentAccessToken()]);
    await new Promise<void>((resolve) => setImmediate(() => resolve()));
    release();

    await expect(all).resolves.toEqual(['new-access', 'new-access', 'new-access']);
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it('starts a fresh rotation after the previous one has settled', async () => {
    stored(SPENT);
    rotatesTo('first');
    await refreshAccessToken();

    rotatesTo('second');
    await expect(refreshAccessToken()).resolves.toBe('second');
    expect(refreshSession).toHaveBeenCalledTimes(2);
  });
});

describe('when a refresh fails', () => {
  it('clears the session when the server refuses the refresh token', async () => {
    stored(SPENT);
    jest.mocked(refreshSession).mockRejectedValue(refusal());

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(clearSession).toHaveBeenCalled();
  });

  it('keeps the session when the refresh fails for want of a network', async () => {
    // Being in a tunnel is not proof that a thirty-day token has expired.
    // Clearing here is how someone loses a valid session by boarding a train.
    stored(SPENT);
    jest.mocked(refreshSession).mockRejectedValue(offline());

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(clearSession).not.toHaveBeenCalled();
  });

  it('does not call the server when there is no refresh token to send', async () => {
    jest.mocked(restoreSession).mockResolvedValue({
      accessToken: 'old',
      refreshToken: '',
      expiresAt: SPENT,
    });

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('recovers on a later attempt after a network failure', async () => {
    stored(SPENT);
    jest.mocked(refreshSession).mockRejectedValueOnce(offline());
    await expect(refreshAccessToken()).resolves.toBeNull();

    rotatesTo('back-online');
    await expect(refreshAccessToken()).resolves.toBe('back-online');
  });
});
