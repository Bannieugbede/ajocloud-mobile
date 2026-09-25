/**
 * The Ajo group code carried by an incoming link, or null.
 *
 * Accepts both forms the same link can arrive as: the app's own scheme
 * (`ajocloud://g/CODE`), and the https link on the website that someone
 * without the app lands on first (`https://ajocloud.com/g/CODE`). The path
 * from before short links, `/join/CODE`, is read the same way.
 *
 * Deliberately plain string work rather than `Linking.parse`. This runs on a
 * value that can be typed, forwarded, or crafted by any page the user visits,
 * so it should be testable without a native module behind it — and the parsing
 * a scheme URL needs is not the part worth delegating.
 *
 * Everything else returns null: this recognises the one shape it understands
 * rather than trying to interpret whatever it is handed.
 */
export function invitationCodeFromUrl(url: string): string | null {
  if (typeof url !== 'string' || url.length === 0) return null;

  // Strip the scheme, then any query or fragment. What remains is the part that
  // names a destination; a code never contains ? or #, so nothing is lost.
  const withoutScheme = url.replace(/^[A-Za-z][A-Za-z0-9+.-]*:\/\//, '');
  if (withoutScheme === url && url.includes('://')) return null;
  const path = withoutScheme.split(/[?#]/)[0] ?? '';

  const segments = path.split('/').filter((segment) => segment.length > 0);

  // The scheme form puts "g" first (ajocloud://g/CODE); the https form puts
  // the host there, so "g" is second (https://host/g/CODE). Only those two
  // positions are accepted: matching "g" anywhere would honour
  // https://anyone.example/x/g/CODE, letting an unrelated page hand the app a
  // code as though the user had been invited.
  const hadScheme = withoutScheme !== url;
  const isSchemeForm = hadScheme && !url.startsWith('http://') && !url.startsWith('https://');
  const joinAt = isSchemeForm ? 0 : 1;
  if (segments[joinAt] !== 'g' && segments[joinAt] !== 'join') return null;

  return normaliseGroupCode(segments[joinAt + 1]);
}

/**
 * The alphabet of every short code in a shared link, mirroring the backend's
 * `src/common/links/share-code.ts`: 0/O, 1/I/L and 8/B are left out.
 */
const SHARE_CODE_ALPHABET = '2345679ACDEFGHJKMNPQRTUVWXYZ';

function normaliseShareCode(input: unknown, length: number): string | null {
  if (typeof input !== 'string') return null;
  const code = input.trim().toUpperCase().replace(/[\s-]/g, '');
  if (code.length !== length) return null;
  for (const character of code) {
    if (!SHARE_CODE_ALPHABET.includes(character)) return null;
  }
  return code;
}

/** A group's permanent 7-character public code, or null. */
export function normalisePublicCode(input: unknown): string | null {
  return normaliseShareCode(input, 7);
}

/**
 * The code in an Ajo group link, in the form the API reads it, or null:
 *
 * - a 10-character invitation,
 * - a listed group's 7-character public code, or
 * - a 43-character invitation from before short links, which is base64url,
 *   case-sensitive, and kept exactly.
 *
 * Checking here means a truncated or mistyped link fails at once rather than
 * after a round trip, and keeps anything odd out of a URL path.
 */
export function normaliseGroupCode(input: unknown): string | null {
  const short = normaliseShareCode(input, 10) ?? normaliseShareCode(input, 7);
  if (short) return short;
  return typeof input === 'string' && /^[A-Za-z0-9_-]{32,128}$/.test(input) ? input : null;
}

export function isPlausibleInvitationCode(code: string): boolean {
  return normaliseGroupCode(code) !== null;
}

/**
 * Mirrors the backend's referral code alphabet and shape (`referral-code.ts`).
 * It leaves out the characters people mistype from a screenshot: 0/O, 1/I/L
 * and 8/B.
 */
const REFERRAL_ALPHABET = '2345679ACDEFGHJKMNPQRTUVWXYZ';
const REFERRAL_PREFIX = 'AJO-';
const REFERRAL_BODY_LENGTH = 6;

/**
 * The canonical form of a referral code from a link, or null.
 *
 * Accepts what the backend accepts — lower case, a missing prefix, stray
 * spaces — so a code that is right in every way that matters is not refused
 * here. Anything else is dropped rather than carried into sign-up, where a
 * code that credits nobody would look as if it had been applied.
 */
export function normaliseReferralCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim().toUpperCase().replace(/\s+/g, '');
  const body = trimmed.startsWith(REFERRAL_PREFIX)
    ? trimmed.slice(REFERRAL_PREFIX.length)
    : trimmed;
  if (body.length !== REFERRAL_BODY_LENGTH) return null;
  for (const character of body) {
    if (!REFERRAL_ALPHABET.includes(character)) return null;
  }
  return `${REFERRAL_PREFIX}${body}`;
}

/** Mirrors the backend's pool-code alphabet (`pool-policy.ts`): no 0/O, 1/I/L. */
const POOL_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * The canonical form of the code in an Akawo pool link, or null: an
 * 8-character join code, or a listed pool's 7-character public code. Compared
 * the way the backend compares them: case-insensitive, spaces and dashes
 * ignored.
 */
export function normalisePoolCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const publicCode = normalisePublicCode(input);
  if (publicCode) return publicCode;
  const code = input.trim().toUpperCase().replace(/[\s-]/g, '');
  if (code.length !== 8) return null;
  for (const character of code) {
    if (!POOL_CODE_ALPHABET.includes(character)) return null;
  }
  return code;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Whether a value is shaped like a Food Ajo programme id. */
export function isProgrammeId(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}

/**
 * The code in a Food Ajo link, canonical, or null: the programme's public code
 * (`/f/<code>`), or its id from a link shared before short codes.
 */
export function normaliseProgrammeRef(input: unknown): string | null {
  const publicCode = normalisePublicCode(input);
  if (publicCode) return publicCode;
  return isProgrammeId(input) ? input.toLowerCase() : null;
}
