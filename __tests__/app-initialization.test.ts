import * as Network from 'expo-network';
import * as Updates from 'expo-updates';

import { getCurrentUser } from '@/api/endpoints/users';
import { initializeApp } from '@/services/app-initialization';
import { clearSession, restoreSession } from '@/services/session-storage';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useRegistrationStore } from '@/store/registration-store';

jest.mock('expo-network');
jest.mock('expo-updates', () => ({ isEnabled: false, checkForUpdateAsync: jest.fn() }));
jest.mock('@/api/endpoints/users');
jest.mock('@/services/session-storage');

beforeEach(() => {
  jest.mocked(Network.getNetworkStateAsync).mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: Network.NetworkStateType.WIFI,
  });
  jest.mocked(restoreSession).mockResolvedValue(null);
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
    profile: { firstName: 'Ayo', lastName: 'Cloud', avatarUrl: null },
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
    profile: { firstName: 'Ayo', lastName: 'Cloud', avatarUrl: null },
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
