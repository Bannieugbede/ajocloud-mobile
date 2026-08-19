import * as WebBrowser from 'expo-web-browser';

import { exchangeGoogleCode } from '@/api/endpoints/auth';
import { GoogleSignInCancelled, signInWithGoogle } from './google-sign-in';

jest.mock('expo-web-browser');
jest.mock('expo-linking', () => ({ createURL: (path: string) => `ajocloud:///${path}` }));
jest.mock('@/api/endpoints/auth', () => ({ exchangeGoogleCode: jest.fn() }));
jest.mock('@/config/environment', () => ({
  environment: { EXPO_PUBLIC_API_BASE_URL: 'https://api.example.test' },
}));

const openAuthSession = jest.mocked(WebBrowser.openAuthSessionAsync);
const exchange = jest.mocked(exchangeGoogleCode);

beforeEach(() => jest.clearAllMocks());

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

    // Both clients must drive the same backend route.
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
