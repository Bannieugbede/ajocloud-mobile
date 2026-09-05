import { installSessionTokens } from '@/api/client/api-client';
import { refreshSession as requestRefresh } from '@/api/endpoints/auth-refresh';
import { clearSession, restoreSession, saveSession } from '@/services/session-storage';
import type { StoredSession } from '@/services/session-storage';

/**
 * Keeps the stored session usable.
 *
 * The access token lives fifteen minutes; the refresh token lives thirty days.
 * Without something to trade one for the other, closing the app for a quarter
 * of an hour was enough to be sent back to Sign in with twenty-nine days of
 * valid session thrown away. This is that trade.
 *
 * Two rules shape the implementation:
 *
 * The backend rotates refresh tokens and treats a second use of one as theft —
 * it marks the session COMPROMISED and revokes every token on it. So a refresh
 * must never be issued twice concurrently. `inFlight` makes every caller that
 * arrives during a refresh await the same promise rather than start its own,
 * which turns a burst of parallel requests on a cold start into one rotation.
 *
 * A refresh that fails because the token is genuinely dead must clear the
 * session; a refresh that fails because the network is down must not, or a
 * commuter going through a tunnel would be signed out and lose a session that
 * is still perfectly valid.
 */

/**
 * Refresh this long before the access token actually expires.
 *
 * A token that passes the check and then expires while the request is in the
 * air fails just the same, so the window covers the round trip and any clock
 * skew between the phone and the server.
 */
const EXPIRY_MARGIN_MS = 60_000;

let inFlight: Promise<StoredSession | null> | null = null;

/**
 * The access token to send, refreshing first if it is spent.
 *
 * Returns null when there is no usable session, which leaves the request to go
 * out unauthenticated and be refused — the caller handles a 401 the same way it
 * always has.
 */
export async function currentAccessToken(): Promise<string | null> {
  const session = await restoreSession();
  if (!session) return null;
  if (!isExpiring(session)) return session.accessToken;
  return (await refreshOnce())?.accessToken ?? null;
}

/**
 * Forces a refresh regardless of the stored expiry, for a request the server
 * has just refused. A clock that is wrong, or a token revoked early, both look
 * like a valid session locally and can only be discovered this way.
 */
export async function refreshAccessToken(): Promise<string | null> {
  return (await refreshOnce())?.accessToken ?? null;
}

/** Whether a stored session still has a refresh token worth trying. */
export function canRefresh(session: StoredSession | null): session is StoredSession {
  return Boolean(session?.refreshToken);
}

function isExpiring(session: StoredSession): boolean {
  const expiresAt = Date.parse(session.expiresAt);
  // An unparseable expiry is treated as spent rather than trusted: refreshing
  // needlessly costs one request, trusting it wrongly costs the session.
  if (Number.isNaN(expiresAt)) return true;
  return expiresAt - EXPIRY_MARGIN_MS <= Date.now();
}

/**
 * Runs one rotation at a time. Callers arriving mid-flight join the existing
 * one, so the rotating token is spent exactly once.
 */
function refreshOnce(): Promise<StoredSession | null> {
  inFlight ??= performRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function performRefresh(): Promise<StoredSession | null> {
  const session = await restoreSession();
  if (!canRefresh(session)) return null;

  try {
    const tokens = await requestRefresh(session.refreshToken);
    const next: StoredSession = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.accessTokenExpiresAt,
    };
    await saveSession(next);
    return next;
  } catch (error) {
    // Only a refusal means the session is over. A timeout, a DNS failure or an
    // offline radio say nothing about whether the token is still good, so the
    // session is kept and the next attempt can succeed.
    if (isRefusal(error)) await clearSession();
    return null;
  }
}

function isRefusal(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('kind' in error)) return false;
  const kind = (error as { kind: unknown }).kind;
  return kind === 'authentication' || kind === 'authorization';
}

/**
 * Hands the shared client its token providers.
 *
 * Done at module load rather than in a startup effect so that no request can
 * be made before the client knows how to authenticate it. `app-initialization`
 * imports this module, so importing it at all is enough to install them.
 *
 * The direction matters: this module imports the client, never the reverse.
 * The client importing the session manager was a cycle — the manager refreshes
 * through an endpoint, and every endpoint imports the client — which Metro
 * resolved by handing one of them an undefined `ApiClient` at startup.
 */
installSessionTokens(currentAccessToken, refreshAccessToken);

/** Test seam: drops any in-flight refresh so cases cannot leak into each other. */
export function resetRefreshStateForTests(): void {
  inFlight = null;
}
