import * as SecureStore from 'expo-secure-store';

import { restoreSession } from '@/services/session-storage';

jest.mock('expo-secure-store');

it('rejects malformed restored sessions', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('{"accessToken":42}');
  await expect(restoreSession()).resolves.toBeNull();
});
