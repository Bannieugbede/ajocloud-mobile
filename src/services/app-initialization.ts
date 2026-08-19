import * as Network from 'expo-network';
import * as Updates from 'expo-updates';

import { getCurrentUser } from '@/api/endpoints/users';
import { clearSession, restoreSession } from '@/services/session-storage';
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

  if (session && Date.parse(session.expiresAt) > Date.now()) {
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
          await clearSession();
        }
      } catch (error) {
        if (isAuthorizationFailure(error)) {
          await clearSession();
          return { initialRoute: signedOutRoute, isOnline, updateAvailable: false };
        }
        // Preserve an unexpired session on transient startup failures. Protected
        // queries still enforce authorization once the app opens.
        initialRoute = resumeRoute();
      }
    }
  } else if (session) {
    await clearSession();
  }

  let updateAvailable = false;
  if (Updates.isEnabled && isOnline) {
    updateAvailable = await Updates.checkForUpdateAsync()
      .then((result) => result.isAvailable)
      .catch(() => false);
  }

  return { initialRoute, isOnline, updateAvailable };
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
