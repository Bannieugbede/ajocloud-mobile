import * as SecureStore from 'expo-secure-store';

import { normaliseReferralCode } from '@/services/incoming-link';

const PENDING_REFERRAL_KEY = 'ajo-cloud-pending-referral';

/**
 * How long a referral stays worth offering at sign-up.
 *
 * Much longer than a held invitation's hour. A referral is not a half-finished
 * action that would surprise anyone if resumed: it only pre-fills an optional
 * field the person can see and change. The gap it has to cover is the one
 * between tapping a friend's link and getting round to signing up, which is
 * often days.
 */
const PENDING_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

type PendingReferral = {
  code: string;
  savedAt: string;
};

/**
 * Holds a referral code until sign-up.
 *
 * A referral code is not a secret, since knowing someone else's earns nothing.
 * It is kept in SecureStore anyway, alongside the held invitation, so pending
 * link state lives in one place and needs no second storage dependency.
 * A later link replaces an earlier one: the most recent person to send a link
 * is the one who got the person to act.
 */
export async function holdReferral(code: string): Promise<void> {
  const canonical = normaliseReferralCode(code);
  if (!canonical) return;
  const pending: PendingReferral = { code: canonical, savedAt: new Date().toISOString() };
  await SecureStore.setItemAsync(PENDING_REFERRAL_KEY, JSON.stringify(pending), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * The held referral code, or null.
 *
 * Read rather than taken, unlike an invitation. Sign-up can be abandoned and
 * restarted, and the code should still be there when it is. It is cleared once
 * an account has actually been created with it.
 */
export async function readHeldReferral(): Promise<string | null> {
  const serialized = await SecureStore.getItemAsync(PENDING_REFERRAL_KEY);
  if (!serialized) return null;

  try {
    const value: unknown = JSON.parse(serialized);
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.savedAt !== 'string') return null;

    const savedAt = Date.parse(record.savedAt);
    if (Number.isNaN(savedAt) || Date.now() - savedAt > PENDING_TTL_MS) {
      await clearHeldReferral();
      return null;
    }
    // Re-validated on the way out, so a stored value can never reach the form
    // in a shape the backend would refuse.
    return normaliseReferralCode(record.code);
  } catch {
    return null;
  }
}

export async function clearHeldReferral(): Promise<void> {
  await SecureStore.deleteItemAsync(PENDING_REFERRAL_KEY);
}
