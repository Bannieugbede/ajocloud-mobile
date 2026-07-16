import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'ajo-cloud-session';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function restoreSession(): Promise<StoredSession | null> {
  const serialized = await SecureStore.getItemAsync(SESSION_KEY);
  if (!serialized) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    return isStoredSession(value) ? value : null;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return ['accessToken', 'refreshToken', 'expiresAt'].every(
    (key) => typeof record[key] === 'string',
  );
}
