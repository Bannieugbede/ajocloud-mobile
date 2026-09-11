import * as Network from 'expo-network';
import * as Updates from 'expo-updates';

import { getCurrentUser } from '@/api/endpoints/users';
import { refreshAccessToken } from '@/services/session-manager';
import { clearSession, restoreSession } from '@/services/session-storage';
import type { StoredSession } from '@/services/session-storage';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useRegistrationStore } from '@/store/registration-store';
import { useThemeStore } from '@/store/theme-store';
import type { AppError } from '@/types/errors';

export type InitialRoute =
  | '/(auth)/onboarding'
  | '/(auth)/sign-in'
  | '/(auth)/verify-email'
  | '/(auth)/create-pin'
  | '/(tabs)/home';

export type AppInitialization = {
  initialRoute: InitialRoute;
  isOnline: boolean;
  updateAvailable: boolean;
};

/**
 * Why a launch decided what it decided.
 *
 * Session loss is reported as "it asks me to log in again", which is the same
 * sentence whether the token was never stored, was stored and vanished, or was
 * stored and refused. Those have different causes and different fixes, so the
 * one launch that can tell them apart says which it was. Never logs a token,
 * only whether one was present and what became of it.
 */
function reportStartup(stage: string, detail?: Record<string, unknown>): void {
  if (!__DEV__) return;
  console.log(`[startup] ${stage}`, detail ?? {});
}

export async function initializeApp(): Promise<AppInitialization> {
  const [session, network] = await Promise.all([
    restoreSession(),
    Network.getNetworkStateAsync().catch(() => null),
    useThemeStore.persist.rehydrate(),
    useOnboardingStore.persist.rehydrate(),
    useRegistrationStore.persist.rehydrate(),
  ]);
  const isOnline = Boolean(network?.isConnected && network.isInternetReachable !== false);
  // First run and every sign-out land on the introduction; once it has been
  // seen the signed-out entry point is Sign in.
  const signedOutRoute: InitialRoute = useOnboardingStore.getState().completed
    ? '/(auth)/sign-in'
    : '/(auth)/onboarding';
  let initialRoute: InitialRoute = signedOutRoute;

  const state = session ? await sessionState(session, isOnline) : 'none';
  reportStartup('session restored', {
    found: session !== null,
    state,
    isOnline,
    // Whether the stored access token had already lapsed. A session that is
    // found but expired is a refresh problem; one that is never found at all is
    // a storage problem, and they are fixed in different places.
    accessTokenExpired: session ? Date.parse(session.expiresAt) <= Date.now() : null,
  });

  if (state !== 'none' && state !== 'expired') {
    if (!isOnline) {
      initialRoute = '/(tabs)/home';
    } else {
      try {
        const user = await getCurrentUser();
        if (user.status === 'ACTIVE') {
          initialRoute = resumeRoute();
        } else if (user.status === 'PENDING_VERIFICATION') {
          // An account that still owes email verification keeps its session and
          // returns to the step it left, rather than being sent back to Sign in
          // with its progress discarded.
          initialRoute = '/(auth)/verify-email';
        } else {
          reportStartup('cleared: account not active', { status: user.status });
          await clearSession();
        }
      } catch (error) {
        if (isAuthorizationFailure(error)) {
          reportStartup('cleared: server refused the session');
          await clearSession();
          return { initialRoute: signedOutRoute, isOnline, updateAvailable: false };
        }
        // Preserve an unexpired session on transient startup failures. Protected
        // queries still enforce authorization once the app opens.
        initialRoute = resumeRoute();
      }
    }
  } else if (state === 'expired') {
    reportStartup('cleared: refresh token refused');
    await clearSession();
  }

  let updateAvailable = false;
  if (Updates.isEnabled && isOnline) {
    updateAvailable = await Updates.checkForUpdateAsync()
      .then((result) => result.isAvailable)
      .catch(() => false);
  }

  reportStartup('resolved', { initialRoute });
  return { initialRoute, isOnline, updateAvailable };
}

type SessionState =
  /** No stored session at all. */
  | 'none'
  /** Usable now, either already valid or just refreshed. */
  | 'live'
  /** Spent, and the server confirmed it cannot be renewed. */
  | 'expired'
  /** Spent, but nothing has disproved it — we simply could not ask. */
  | 'unverified';

/**
 * Whether a stored session is still worth opening the app with.
 *
 * An expired access token is not an expired session: it lives fifteen minutes,
 * while the refresh token behind it lives thirty days. Trading one for the
 * other here is what stops closing the app for a quarter of an hour from
 * ending on the Sign in screen.
 */
async function sessionState(session: StoredSession, isOnline: boolean): Promise<SessionState> {
  if (Date.parse(session.expiresAt) > Date.now()) return 'live';
  // Offline with a spent token: it can be neither renewed nor disproved, so it
  // is kept for the next launch that has a network rather than discarded on no
  // evidence. Every protected query will still fail until then.
  if (!isOnline) return 'unverified';
  return (await refreshAccessToken()) === null ? 'expired' : 'live';
}

/**
 * Where a verified account belongs. Account creation continues past
 * verification, so someone who closed the app before setting a transaction PIN
 * resumes at that step instead of landing on a home screen they cannot
 * transact from.
 */
function resumeRoute(): InitialRoute {
  const { step, pinSet } = useRegistrationStore.getState();
  if (step !== null && !pinSet) return '/(auth)/create-pin';
  return '/(tabs)/home';
}

function isAuthorizationFailure(error: unknown): error is AppError {
  if (typeof error !== 'object' || error === null || !('kind' in error)) return false;
  const kind = (error as AppError).kind;
  return kind === 'authentication' || kind === 'authorization';
}
