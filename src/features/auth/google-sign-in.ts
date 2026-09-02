import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { exchangeGoogleCode } from '@/api/endpoints/auth';
import type { TokenPair } from '@/api/endpoints/auth';
import { environment } from '@/config/environment';

/** Deep link path the backend returns to; must match GOOGLE_MOBILE_SUCCESS_URL. */
export const GOOGLE_REDIRECT_PATH = 'auth/google';

export class GoogleSignInCancelled extends Error {
  constructor() {
    super('Google sign-in was cancelled');
    this.name = 'GoogleSignInCancelled';
  }
}

/**
 * The redirect the browser is told to return to.
 *
 * `Linking.createURL` is deliberately passed `isTripleSlashed: true`. Its
 * default produces `ajocloud://auth/google`, where `auth` parses as the host
 * and only `/google` as the path, while the backend's success URL is
 * `ajocloud:///auth/google`. Android's auth-session polyfill compares the two
 * with `startsWith`, so the mismatch left the browser open forever rather than
 * failing visibly. Both sides now agree on the triple-slashed form, which keeps
 * the whole of `auth/google` in the path where the route lives.
 */
export function googleRedirectUrl(): string {
  return Linking.createURL(GOOGLE_REDIRECT_PATH, { isTripleSlashed: true });
}

/**
 * Reads the one-time handoff code out of the returned deep link.
 *
 * Parsed with `Linking.parse` rather than `URL`, because a custom scheme is not
 * a special scheme: `new URL` splits `ajocloud://auth/google` and
 * `ajocloud:///auth/google` into different host/path pairs, so a change of slash
 * form silently moved the query string. `Linking.parse` handles both.
 */
export function extractHandoffCode(url: string): string | null {
  const code = Linking.parse(url).queryParams?.['code'];
  return typeof code === 'string' && code.length > 0 ? code : null;
}

/**
 * Runs the same backend-owned OAuth flow the web app uses. The system browser
 * handles consent, the backend redirects back to this app's scheme with a
 * one-time code, and that code is exchanged for tokens over TLS — the deep link
 * itself never carries a session.
 */
export async function signInWithGoogle(): Promise<TokenPair> {
  const baseUrl = environment.EXPO_PUBLIC_API_BASE_URL;
  if (!baseUrl) throw new Error('API configuration is unavailable');

  const redirectUrl = googleRedirectUrl();
  const authUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/auth/google?client=mobile`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
  if (result.type !== 'success') throw new GoogleSignInCancelled();

  const code = extractHandoffCode(result.url);
  if (!code) throw new Error('Google sign-in did not complete');

  return exchangeGoogleCode(code);
}
