import {
  normaliseGroupCode,
  normalisePoolCode,
  normaliseProgrammeRef,
  normaliseReferralCode,
} from '@/services/incoming-link';

export type InstallAttribution = {
  /** An Ajo group link code: an invitation, or a listed group's public code. */
  invitationCode: string | null;
  /** An Akawo pool join code, or a listed pool's public code. Canonical. */
  poolCode: string | null;
  /** A Food Ajo programme's public code, or its id from an older link. */
  programmeId: string | null;
  referralCode: string | null;
};

/**
 * What the website attached to a Play Store install.
 *
 * The website's Play link carries one destination (`ajocloud_invite`,
 * `ajocloud_pool` or `ajocloud_food`) and optionally `ajocloud_ref`
 * (`src/lib/attribution.ts` in the web repository), and Google Play returns
 * that string to the app through the Install Referrer API. It sits beside the
 * `utm_*` values Play adds itself, so only the prefixed keys are read.
 *
 * Anyone can craft a Play link, so this is exactly as trustworthy as a deep
 * link: each value is validated, and a malformed one is dropped rather than
 * passed on.
 *
 * Plain string splitting rather than `URLSearchParams`, which React Native
 * implements only partly, and so this can be tested without a native module.
 */
export function attributionFromInstallReferrer(referrer: unknown): InstallAttribution {
  const attribution: InstallAttribution = {
    invitationCode: null,
    poolCode: null,
    programmeId: null,
    referralCode: null,
  };
  if (typeof referrer !== 'string' || referrer.length === 0) return attribution;

  for (const pair of referrer.split('&')) {
    const separator = pair.indexOf('=');
    if (separator <= 0) continue;
    const key = pair.slice(0, separator);
    let value: string;
    try {
      value = decodeURIComponent(pair.slice(separator + 1).replace(/\+/g, ' '));
    } catch {
      continue;
    }

    if (key === 'ajocloud_invite') {
      attribution.invitationCode = normaliseGroupCode(value);
    } else if (key === 'ajocloud_pool') {
      attribution.poolCode = normalisePoolCode(value);
    } else if (key === 'ajocloud_food') {
      attribution.programmeId = normaliseProgrammeRef(value);
    } else if (key === 'ajocloud_ref') {
      attribution.referralCode = normaliseReferralCode(value);
    }
  }
  return attribution;
}
