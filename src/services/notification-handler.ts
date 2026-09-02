import * as Notifications from 'expo-notifications';

/**
 * How a notification behaves when it arrives while the app is open.
 *
 * Set once at module load, before any listener runs: Expo requires the handler
 * to answer within three seconds or the notification is discarded, so it must
 * not depend on anything that might still be initialising.
 *
 * Foreground alerts are shown because these are money events — a payout
 * arriving is worth interrupting for, whichever screen the user is on.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
      }),
  });
}

/** In-app destinations a notification is allowed to open. */
const ALLOWED_PREFIXES = ['/(tabs)/'];

/**
 * The path a notification tap should navigate to, or null.
 *
 * Only in-app paths are honoured, and only ones under the tab group. The link
 * arrives from the server through Apple's and Google's infrastructure, so
 * following it unchecked would let anything that can forge a payload send a
 * user to an arbitrary destination.
 */
export function safeDeepLink(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const link = (data as { deepLink?: unknown }).deepLink;
  if (typeof link !== 'string') return null;
  // Rejects protocol-relative and absolute URLs along with anything outside the
  // known prefixes.
  if (link.includes('://') || link.startsWith('//')) return null;
  return ALLOWED_PREFIXES.some((prefix) => link.startsWith(prefix)) ? link : null;
}
