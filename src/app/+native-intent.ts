/**
 * Redirects system-delivered links that have no route of their own, or that
 * must not reach the route their path would otherwise match.
 *
 * `ajocloud:///auth/google` is the OAuth return URL. It is normally consumed
 * in-process by `openAuthSessionAsync`, which resolves as soon as the browser
 * returns, so no navigation happens and no route is needed. But if the OS
 * delivers the link cold, the router would try to navigate to a path that does
 * not exist. Sending it to sign-in leaves the user somewhere they can act. The
 * handoff code is deliberately dropped: it is single-use and short-lived, and
 * the session that requested it is gone.
 *
 * The website's shared links are short: `/g/<code>` (Ajo), `/p/<code>`
 * (Akawo pool), `/f/<code>` (Food Ajo) and `/r/<code>` (referral), reached
 * through the app's scheme or a universal link. Each goes to the app's entry
 * screen for it, all of which handle a signed-out arrival: the Ajo invitation
 * screen, the public pool and programme screens under `/invite`, and sign-up
 * with the referral. The paths from before short links (`/akawo/join/<code>`,
 * `/food/<id>`; `/join/<code>` routes by itself) keep working. The `?ref=` a
 * link may carry is kept, and nothing else in its query.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    // Custom schemes are not "special", so pathname parsing differs between the
    // double- and triple-slashed forms. Matching on the raw string covers both.
    if (/(^|\/)auth\/google(\?|$)/.test(path)) return '/sign-in';

    const query = queryOf(path);

    // Only as the first segment of the path: `ajocloud://g/X`,
    // `https://<host>/g/X` or `/g/X`. Anywhere deeper is not a link we issue.
    const short = /^(?:ajocloud:\/\/\/?|https?:\/\/[^/?#]+\/|\/)?([gpfr])\/([^/?#]+)/.exec(path);
    if (short?.[1] && short[2]) {
      const [, kind, code] = short;
      if (kind === 'g') return `/join/${code}${query}`;
      if (kind === 'p') return `/invite/akawo/${code}${query}`;
      if (kind === 'f') return `/invite/food/${code}${query}`;
      return `/join?ref=${code}`;
    }

    const pool = /(?:^|\/)akawo\/join\/([^/?#]+)/.exec(path);
    if (pool?.[1]) return `/invite/akawo/${pool[1]}${query}`;
    const food = /(?:^|\/)food\/([0-9a-fA-F-]{36})(?=[/?#]|$)/.exec(path);
    if (food?.[1]) return `/invite/food/${food[1]}${query}`;

    return path;
  } catch {
    // A malformed link must never prevent the app from starting.
    return '/sign-in';
  }
}

/** Only `ref` is carried across; nothing else in a link's query is trusted. */
function queryOf(path: string): string {
  const match = /[?&]ref=([^&#]*)/.exec(path);
  return match?.[1] ? `?ref=${match[1]}` : '';
}
