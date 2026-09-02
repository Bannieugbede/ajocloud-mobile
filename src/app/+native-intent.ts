/**
 * Redirects deep links that have no route of their own.
 *
 * `ajocloud:///auth/google` is the OAuth return URL. It is normally consumed
 * in-process by `openAuthSessionAsync`, which resolves as soon as the browser
 * returns, so no navigation happens and no route is needed. But if the OS
 * delivers the link cold — the app was killed while the browser was open, or
 * the user opened the link from elsewhere — the router would try to navigate to
 * a path that does not exist. Sending it to sign-in leaves the user somewhere
 * they can act, rather than on an unhandled route.
 *
 * The handoff code in the URL is deliberately dropped: it is single-use and
 * short-lived, and by this point the session that requested it is gone, so
 * redeeming it here would attach a session to a flow the user did not complete.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    // Custom schemes are not "special", so pathname parsing differs between the
    // double- and triple-slashed forms. Matching on the raw string covers both.
    if (/(^|\/)auth\/google(\?|$)/.test(path)) return '/sign-in';
    return path;
  } catch {
    // A malformed link must never prevent the app from starting.
    return '/sign-in';
  }
}
