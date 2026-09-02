import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { exchangeGoogleCode } from '@/api/endpoints/auth';
import {
  GoogleSignInCancelled,
  extractHandoffCode,
  googleRedirectUrl,
  signInWithGoogle,
} from './google-sign-in';

jest.mock('expo-web-browser');
// expo-linking is intentionally NOT mocked: the defect this suite guards was
// created by the real createURL/parse behaviour, so a hand-written stub would
// have reproduced the bug rather than caught it. Only the native constants it
// reads are stubbed, to stand in for a standalone (non-Expo-Go) build.
jest.mock('expo-constants', () => ({
  __esModule: true,
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
  default: {
    expoConfig: { scheme: 'ajocloud' },
    executionEnvironment: 'standalone',
  },
}));
jest.mock('@/api/endpoints/auth', () => ({ exchangeGoogleCode: jest.fn() }));
jest.mock('@/config/environment', () => ({
  environment: { EXPO_PUBLIC_API_BASE_URL: 'https://api.example.test' },
}));

const openAuthSession = jest.mocked(WebBrowser.openAuthSessionAsync);
const exchange = jest.mocked(exchangeGoogleCode);

beforeEach(() => jest.clearAllMocks());

describe('googleRedirectUrl', () => {
  it('is triple-slashed so it matches the backend success URL exactly', () => {
    // Android compares the returned URL with startsWith, so a differing slash
    // count leaves the browser open instead of completing sign-in.
    expect(googleRedirectUrl()).toBe('ajocloud:///auth/google');
  });

  it('keeps the whole redirect path in the path, not the host', () => {
    const parsed = Linking.parse(googleRedirectUrl());
    expect(parsed.path).toBe('auth/google');
    // 'auth' must not be swallowed as the hostname.
    expect(parsed.hostname).toBeFalsy();
  });
});

describe('extractHandoffCode', () => {
  // The backend builds its redirect with `new URL`, so the app must tolerate
  // either slash form rather than assuming one.
  it.each([
    ['triple-slashed', 'ajocloud:///auth/google?code=handoff-code'],
    ['double-slashed', 'ajocloud://auth/google?code=handoff-code'],
  ])('reads the code from a %s link', (_label, url) => {
    expect(extractHandoffCode(url)).toBe('handoff-code');
  });

  it('returns null when no code is present', () => {
    expect(extractHandoffCode('ajocloud:///auth/google')).toBeNull();
  });

  it('returns null for an empty code rather than exchanging it', () => {
    expect(extractHandoffCode('ajocloud:///auth/google?code=')).toBeNull();
  });
});

describe('signInWithGoogle', () => {
  it('opens the backend flow and exchanges the returned code', async () => {
    openAuthSession.mockResolvedValue({
      type: 'success',
      url: 'ajocloud:///auth/google?code=handoff-code',
    });
    exchange.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: '15m',
      accessTokenExpiresAt: new Date().toISOString(),
    });

    await expect(signInWithGoogle()).resolves.toMatchObject({ accessToken: 'access' });

    // Both clients must drive the same backend route, and the redirect handed to
    // the browser must be the triple-slashed form the backend returns to.
    expect(openAuthSession).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/auth/google?client=mobile',
      'ajocloud:///auth/google',
    );
    expect(exchange).toHaveBeenCalledWith('handoff-code');
  });

  it('reports cancellation distinctly so it is not shown as an error', async () => {
    openAuthSession.mockResolvedValue({ type: WebBrowser.WebBrowserResultType.CANCEL });
    await expect(signInWithGoogle()).rejects.toBeInstanceOf(GoogleSignInCancelled);
    expect(exchange).not.toHaveBeenCalled();
  });

  it('fails when the deep link carries no code', async () => {
    openAuthSession.mockResolvedValue({ type: 'success', url: 'ajocloud:///auth/google' });
    await expect(signInWithGoogle()).rejects.toThrow('Google sign-in did not complete');
    expect(exchange).not.toHaveBeenCalled();
  });
});
