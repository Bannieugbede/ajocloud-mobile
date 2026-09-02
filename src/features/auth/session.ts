import type { TokenPair } from '@/api/endpoints/auth';
import { registerThisDevice } from '@/services/push-registration';
import { saveSession } from '@/services/session-storage';

/**
 * Stores a new session and registers this device.
 *
 * Registration happens here rather than in each screen because this is the one
 * point every sign-in passes through — password, OTP and Google alike — so no
 * authentication path can forget to announce the device.
 *
 * It runs after the session is stored, because registering is an authenticated
 * call that needs the token that was just saved. It is deliberately not awaited
 * by the caller's navigation: a device that cannot be registered right now
 * still has a valid session, and blocking the sign-in on a push token would
 * make a slow network look like a failed login.
 */
export async function saveTokenPair(tokens: TokenPair): Promise<void> {
  await saveSession({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.accessTokenExpiresAt,
  });
  // registerThisDevice swallows its own failures, so this cannot reject.
  void registerThisDevice();
}
