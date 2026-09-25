import * as SecureStore from 'expo-secure-store';

import {
  isPlausibleInvitationCode,
  isProgrammeId,
  normalisePoolCode,
} from '@/services/incoming-link';

const PENDING_INVITE_KEY = 'ajo-cloud-pending-invitation';

/**
 * How long a held destination stays worth resuming.
 *
 * Shorter than an invitation's own fortnight, because this is about one
 * uninterrupted intent: someone opened a link, was asked to sign in, and came
 * back. A code still sitting here a day later belongs to a journey that was
 * abandoned, and silently opening a group on the next sign-in would be a
 * surprise rather than a convenience.
 */
const PENDING_TTL_MS = 60 * 60 * 1_000;

/**
 * Where a link was taking someone before they had to sign in.
 *
 * An Ajo group invitation, an Akawo pool join code, or a Food Ajo programme.
 * One at a time: the newest link is the one the person is acting on.
 */
export type HeldDestination =
  | { kind: 'ajo'; code: string }
  | { kind: 'akawo'; code: string }
  | { kind: 'food'; programmeId: string };

type Stored = HeldDestination & { savedAt: string };

/**
 * Holds a destination across sign-in.
 *
 * SecureStore rather than AsyncStorage: an Ajo invitation or an Akawo join
 * code admits whoever holds it, so it is stored the way a token is.
 */
export async function holdDestination(destination: HeldDestination): Promise<void> {
  const stored: Stored = { ...destination, savedAt: new Date().toISOString() };
  await SecureStore.setItemAsync(PENDING_INVITE_KEY, JSON.stringify(stored), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/** Holds an Ajo group invitation code across sign-in. */
export function holdInvitation(code: string): Promise<void> {
  return holdDestination({ kind: 'ajo', code });
}

/**
 * Returns the held destination and clears it, or null if there is none.
 *
 * Taking rather than reading: a destination that has been handed back has
 * been acted on, and leaving it in place would re-offer it on every launch.
 * Everything is re-validated on the way out, and a record written before
 * pools and programmes could be held (`{ code, savedAt }`) still reads as an
 * Ajo invitation.
 */
export async function takeHeldDestination(): Promise<HeldDestination | null> {
  const serialized = await SecureStore.getItemAsync(PENDING_INVITE_KEY);
  if (!serialized) return null;
  await clearHeldInvitation();

  try {
    const value: unknown = JSON.parse(serialized);
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.savedAt !== 'string') return null;
    const savedAt = Date.parse(record.savedAt);
    if (Number.isNaN(savedAt) || Date.now() - savedAt > PENDING_TTL_MS) return null;

    const kind = record.kind ?? 'ajo';
    if (kind === 'ajo' && typeof record.code === 'string') {
      return isPlausibleInvitationCode(record.code) ? { kind: 'ajo', code: record.code } : null;
    }
    if (kind === 'akawo') {
      const code = normalisePoolCode(record.code);
      return code ? { kind: 'akawo', code } : null;
    }
    if (kind === 'food' && isProgrammeId(record.programmeId)) {
      return { kind: 'food', programmeId: record.programmeId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearHeldInvitation(): Promise<void> {
  await SecureStore.deleteItemAsync(PENDING_INVITE_KEY);
}
