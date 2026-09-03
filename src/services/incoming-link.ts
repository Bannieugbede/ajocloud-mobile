/**
 * The invitation code carried by an incoming link, or null.
 *
 * Accepts both forms the same invitation can arrive as: the app's own scheme
 * (`ajocloud://join/CODE`), and the https link on the website that someone
 * without the app lands on first (`https://ajocloud.com/join/CODE`).
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

  // The scheme form puts "join" first (ajocloud://join/CODE); the https form
  // puts the host there, so "join" is second (https://host/join/CODE). Only
  // those two positions are accepted: matching "join" anywhere would honour
  // https://anyone.example/x/join/CODE, letting an unrelated page hand the app
  // a code as though the user had been invited.
  const hadScheme = withoutScheme !== url;
  const isSchemeForm = hadScheme && !url.startsWith('http://') && !url.startsWith('https://');
  const joinAt = isSchemeForm ? 0 : 1;
  if (segments[joinAt] !== 'join') return null;

  const code = segments[joinAt + 1];
  if (!code) return null;

  return isPlausibleInvitationCode(code) ? code : null;
}

/**
 * Whether a code is shaped like one the API issues: 32 random bytes as
 * base64url. Checking here means a truncated or mistyped link fails at once
 * rather than after a round trip, and keeps anything odd out of a URL path.
 */
export function isPlausibleInvitationCode(code: string): boolean {
  return /^[A-Za-z0-9_-]{32,128}$/.test(code);
}
