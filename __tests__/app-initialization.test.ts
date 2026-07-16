import * as Network from 'expo-network';
import * as Updates from 'expo-updates';

import { getCurrentUser } from '@/api/endpoints/users';
import { initializeApp } from '@/services/app-initialization';
import { clearSession, restoreSession } from '@/services/session-storage';

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
});

it('routes a signed-out user to public entry', async () => {
  await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(auth)/welcome' });
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
  await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(tabs)' });
});

it('clears an expired session', async () => {
  jest.mocked(restoreSession).mockResolvedValue({
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresAt: new Date(0).toISOString(),
  });
  await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(auth)/welcome' });
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
  await expect(initializeApp()).resolves.toMatchObject({ initialRoute: '/(auth)/welcome' });
  expect(clearSession).toHaveBeenCalled();
});
