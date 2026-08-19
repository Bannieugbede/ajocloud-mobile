import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { exchangeGoogleCode } from '@/api/endpoints/auth';
import type { TokenPair } from '@/api/endpoints/auth';
import { environment } from '@/config/environment';

/** Deep link the backend returns to; must match GOOGLE_MOBILE_SUCCESS_URL. */
export const GOOGLE_REDIRECT_PATH = 'auth/google';

export class GoogleSignInCancelled extends Error {
  constructor() {
    super('Google sign-in was cancelled');
    this.name = 'GoogleSignInCancelled';
  }
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

  const redirectUrl = Linking.createURL(GOOGLE_REDIRECT_PATH);
  const authUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/auth/google?client=mobile`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
  if (result.type !== 'success') throw new GoogleSignInCancelled();

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('Google sign-in did not complete');

  return exchangeGoogleCode(code);
}
