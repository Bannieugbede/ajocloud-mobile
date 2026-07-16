import * as Network from 'expo-network';
import * as Updates from 'expo-updates';

import { getCurrentUser } from '@/api/endpoints/users';
import { clearSession, restoreSession } from '@/services/session-storage';
import { useThemeStore } from '@/store/theme-store';
import type { AppError } from '@/types/errors';

export type InitialRoute = '/(auth)/welcome' | '/(tabs)';

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
  ]);
  const isOnline = Boolean(network?.isConnected && network.isInternetReachable !== false);
  let initialRoute: InitialRoute = '/(auth)/welcome';

  if (session && Date.parse(session.expiresAt) > Date.now()) {
    if (!isOnline) {
      initialRoute = '/(tabs)';
    } else {
      try {
        const user = await getCurrentUser();
        if (user.status === 'ACTIVE') initialRoute = '/(tabs)';
        else await clearSession();
      } catch (error) {
        if (isAuthorizationFailure(error)) {
          await clearSession();
          return { initialRoute: '/(auth)/welcome', isOnline, updateAvailable: false };
        }
        // Preserve an unexpired session on transient startup failures. Protected
        // queries still enforce authorization once the app opens.
        initialRoute = '/(tabs)';
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

function isAuthorizationFailure(error: unknown): error is AppError {
  if (typeof error !== 'object' || error === null || !('kind' in error)) return false;
  const kind = (error as AppError).kind;
  return kind === 'authentication' || kind === 'authorization';
}
