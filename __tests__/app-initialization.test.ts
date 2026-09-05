import * as Network from 'expo-network';
import * as Updates from 'expo-updates';

import { getCurrentUser } from '@/api/endpoints/users';
import { initializeApp } from '@/services/app-initialization';
import { refreshAccessToken } from '@/services/session-manager';
import { clearSession, restoreSession } from '@/services/session-storage';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useRegistrationStore } from '@/store/registration-store';

jest.mock('expo-network');
jest.mock('expo-updates', () => ({ isEnabled: false, checkForUpdateAsync: jest.fn() }));
jest.mock('@/api/endpoints/users');
jest.mock('@/services/session-storage');
jest.mock('@/services/session-manager');

beforeEach(() => {
  // Call counts, not just return values: several cases below assert that a
  // refresh was never attempted, which a previous test's calls would mask.
  jest.clearAllMocks();
  jest.mocked(Network.getNetworkStateAsync).mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: Network.NetworkStateType.WIFI,
  });
  jest.mocked(restoreSession).mockResolvedValue(null);
  jest.mocked(refreshAccessToken).mockResolvedValue(null);
  useOnboardingStore.setState({ completed: true });
  useRegistrationStore.setState({ step: null, userId: null, emailVerified: false, pinSet: false });
});

/** A live session for a user in the given account state. */
function signedInAs(status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED') {
  jest.mocked(restoreSession).mockResolvedValue({
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
  jest.mocked(getCurrentUser).mockResolvedValue({
    id: 'user',
    email: 'member@example.com',
    phone: '+2348012345678',
    status,
    profile: {
      firstName: 'Ayo',
      lastName: 'Cloud',
      avatarUrl: null,
      timezone: 'Africa/Lagos',
      locale: 'en-NG',
    },
  });
}

it('returns an unverified account to email verification, keeping its session', async () => {
  signedInAs('PENDING_VERIFICATION');
  await expect(initializeApp()).resolves.toMatchObject({
    initialRoute: '/(auth)/verify-email',
  });
  expect(clearSession).not.toHaveBeenCalled();
});

it('resumes a verified account that never set a transaction PIN', async () => {
  signedInAs('ACTIVE');
  useRegistrationStore.setState({
    step: 'create-pin',
    userId: 'user',
    emailVerified: true,
    pinSet: false,
  });
  await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(auth)/create-pin' });
});

it('sends a fully set-up account straight to home', async () => {
  signedInAs('ACTIVE');
  useRegistrationStore.setState({
    step: 'intent',
    userId: 'user',
    emailVerified: true,
    pinSet: true,
  });
  await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(tabs)/home' });
});

it('routes a signed-out user to public entry', async () => {
  await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(auth)/sign-in' });
});

it('routes a first-run install to the introduction', async () => {
  useOnboardingStore.setState({ completed: false });
  await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(auth)/onboarding' });
});

it('restores an active authenticated session', async () => {
  jest.mocked(restoreSession).mockResolvedValue({
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
  jest.mocked(getCurrentUser).mockResolvedValue({
    id: 'user',
    email: 'member@example.com',
    phone: '+2348012345678',
    status: 'ACTIVE',
    profile: {
      firstName: 'Ayo',
      lastName: 'Cloud',
      avatarUrl: null,
      timezone: 'Africa/Lagos',
      locale: 'en-NG',
    },
  });
  await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(tabs)/home' });
});

it('clears an expired session', async () => {
  jest.mocked(restoreSession).mockResolvedValue({
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresAt: new Date(0).toISOString(),
  });
  await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(auth)/sign-in' });
  expect(clearSession).toHaveBeenCalled();
  expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();
});

it('clears a session rejected by the API', async () => {
  jest.mocked(restoreSession).mockResolvedValue({
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
  jest.mocked(getCurrentUser).mockRejectedValue({ kind: 'authentication', message: 'Expired' });
  await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(auth)/sign-in' });
  expect(clearSession).toHaveBeenCalled();
});

describe('an access token that expired while the app was closed', () => {
  /** A stored session whose access token is spent but whose refresh token is not. */
  function spentAccessToken() {
    jest.mocked(restoreSession).mockResolvedValue({
      accessToken: 'expired-access',
      refreshToken: 'still-valid-refresh',
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
  }

  function activeUser() {
    jest.mocked(getCurrentUser).mockResolvedValue({
      id: 'user',
      email: 'member@example.com',
      phone: '+2348012345678',
      status: 'ACTIVE',
      profile: {
        firstName: 'Ayo',
        lastName: 'Cloud',
        avatarUrl: null,
        timezone: 'Africa/Lagos',
        locale: 'en-NG',
      },
    });
  }

  it('refreshes and stays signed in instead of returning to sign in', async () => {
    // The access token lives fifteen minutes and the refresh token thirty
    // days. Closing the app over lunch used to discard the second because the
    // first had lapsed, which is the whole of the reported bug.
    spentAccessToken();
    jest.mocked(refreshAccessToken).mockResolvedValue('fresh-access');
    activeUser();

    await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(tabs)/home' });
    expect(clearSession).not.toHaveBeenCalled();
  });

  it('signs out only once the server has refused the refresh token', async () => {
    spentAccessToken();
    jest.mocked(refreshAccessToken).mockResolvedValue(null);

    await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(auth)/sign-in' });
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it('keeps an unrefreshable session when the device is offline', async () => {
    // Offline, the token can be neither renewed nor disproved. Discarding it
    // would sign someone out for opening the app on a plane.
    spentAccessToken();
    jest.mocked(Network.getNetworkStateAsync).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
      type: Network.NetworkStateType.NONE,
    });

    await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(tabs)/home' });
    expect(clearSession).not.toHaveBeenCalled();
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it('does not refresh a session whose access token is still good', async () => {
    signedInAs('ACTIVE');

    await initializeApp();

    expect(refreshAccessToken).not.toHaveBeenCalled();
  });
});
