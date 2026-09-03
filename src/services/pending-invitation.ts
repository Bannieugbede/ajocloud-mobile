import * as SecureStore from 'expo-secure-store';

const PENDING_INVITE_KEY = 'ajo-cloud-pending-invitation';

/**
 * How long a held invitation stays worth resuming.
 *
 * Shorter than the invitation's own fortnight, because this is about one
 * uninterrupted intent: someone opened a link, was asked to sign in, and came
 * back. A code still sitting here a day later belongs to a journey that was
 * abandoned, and silently joining a group on the next sign-in would be a
 * surprise rather than a convenience.
 */
const PENDING_TTL_MS = 60 * 60 * 1_000;

type PendingInvitation = {
  code: string;
  savedAt: string;
};

/**
 * Holds an invitation code across sign-in.
 *
 * SecureStore rather than AsyncStorage: this code is a bearer credential for a
 * place in someone's savings group, and anything that can read it can redeem
 * it.
 */
export async function holdInvitation(code: string): Promise<void> {
  const pending: PendingInvitation = { code, savedAt: new Date().toISOString() };
  await SecureStore.setItemAsync(PENDING_INVITE_KEY, JSON.stringify(pending), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Returns a held invitation and clears it, or null if there is none.
 *
 * Taking rather than reading: a code that has been handed back has been acted
 * on, and leaving it in place would re-offer the same group on every later
 * launch.
 */
export async function takeHeldInvitation(): Promise<string | null> {
  const serialized = await SecureStore.getItemAsync(PENDING_INVITE_KEY);
  if (!serialized) return null;
  await clearHeldInvitation();

  try {
    const value: unknown = JSON.parse(serialized);
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.code !== 'string' || typeof record.savedAt !== 'string') return null;

    const savedAt = Date.parse(record.savedAt);
    if (Number.isNaN(savedAt) || Date.now() - savedAt > PENDING_TTL_MS) return null;
    return record.code;
  } catch {
    return null;
  }
}

export async function clearHeldInvitation(): Promise<void> {
  await SecureStore.deleteItemAsync(PENDING_INVITE_KEY);
}
