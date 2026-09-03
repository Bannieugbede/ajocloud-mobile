import { useLinkingURL } from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { invitationCodeFromUrl } from '@/services/incoming-link';

/**
 * Opens the invitation screen when the app is launched or resumed by a link.
 *
 * `useLinkingURL` rather than an event listener, because it reports the URL
 * that launched the app as well as later ones. An invitation is most often the
 * first thing someone opens the app for, and that launch URL is exactly what a
 * listener registered at render time would miss.
 *
 * Expo Router resolves `ajocloud://join/CODE` to this route by itself. This
 * exists for the other arrivals — a resumed app, and the https link handed over
 * by the website — which reach the app as a URL and not as a route.
 */
export function useIncomingInvitation(): void {
  const url = useLinkingURL();
  // The same URL keeps being returned after it has been handled, so navigating
  // on every render would fight whatever the user did next.
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!url || handled.current === url) return;

    const code = invitationCodeFromUrl(url);
    if (!code) return;

    handled.current = url;
    router.push({ pathname: '/join/[code]', params: { code } });
  }, [url]);
}
