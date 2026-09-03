import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { safeDeepLink } from '@/services/notification-handler';

/**
 * Navigates when a notification is tapped.
 *
 * `useLastNotificationResponse` rather than a plain listener, because it also
 * reports the tap that launched the app from cold — a listener registered
 * during render would be too late for that, which is the common case: the
 * notification arrives while the app is closed.
 *
 * The destination is validated before it is followed. A push payload crosses
 * Apple's and Google's infrastructure, so the link is treated as untrusted
 * input rather than as something the server can be relied on to have got right.
 */
export function useNotificationNavigation(): void {
  const response = Notifications.useLastNotificationResponse();
  // The hook keeps returning the same response after it has been handled, so
  // the identifier of the one already acted on is remembered. Without this, any
  // later re-render would navigate again and fight whatever the user did next.
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const { identifier } = response.notification.request;
    if (handled.current === identifier) return;

    const target = safeDeepLink(response.notification.request.content.data);
    if (!target) return;

    handled.current = identifier;
    router.push(target as Parameters<typeof router.push>[0]);
  }, [response]);
}
