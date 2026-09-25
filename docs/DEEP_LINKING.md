# Deep Linking

Only the configured application scheme and approved universal/app-link HTTPS hosts are accepted.
Parse links into typed intents; never pass arbitrary paths directly to Router. Validate target type,
opaque ID, one-time token format, callback state/nonce, expiry, and allowlisted external return URL.

Startup stores one pending intent, restores/refreshes session, applies verification/onboarding/
organization/branch/role guards, and navigates only if authorized. Recovery and verification tokens
are consumed once and removed from navigation history. Payment callbacks reconcile status from the
backend rather than trusting query parameters. Unknown or unauthorized links show a safe native
error and route to the nearest valid home.

Test cold/warm/background launches, signed-out and wrong-role users, expired/replayed/malformed links,
redirect loops, deleted records, user switching, percent encoding, hostile hosts, payment state/nonce,
and notification payload equivalence.

## Google sign-in return (`ajocloud:///auth/google`)

The OAuth flow returns to this link. Two rules keep it working, and both were
broken before 2026-09-02.

**It must be triple-slashed.** `Linking.createURL('auth/google')` defaults to
`ajocloud://auth/google`, which parses `auth` as the _host_ and only `/google`
as the path, while the backend's `GOOGLE_MOBILE_SUCCESS_URL` is
`ajocloud:///auth/google`. Android's auth session compares the returned URL with
`startsWith`, so a mismatch does not raise an error — the browser simply never
returns and sign-in appears to hang. `googleRedirectUrl()` therefore passes
`isTripleSlashed: true`, and the backend's env schema now rejects the
double-slashed form at boot.

**The code is read with `Linking.parse`, not `new URL`.** A custom scheme is not
a "special" scheme, so `new URL` splits the two slash forms into different
host/path pairs. `extractHandoffCode` tolerates either.

Changing the app's `scheme` in `app.json` breaks this link unless
`GOOGLE_MOBILE_SUCCESS_URL` changes with it. The `bundleIdentifier` and Android
`package` do **not** affect it — only `scheme` does.

`app/+native-intent.ts` redirects a cold-start delivery of this link to
`/sign-in`. The handoff code is deliberately dropped: it is single-use and the
session that requested it is gone.

## Invitation links (`/join/<code>`)

The same invitation arrives in three forms, all ending on `join/[code]`:

| Form                               | iOS                       | Android                        |
| ---------------------------------- | ------------------------- | ------------------------------ |
| `ajocloud://join/<code>`           | Opens the app             | Opens the app                  |
| `https://ajocloud.com/join/<code>` | Opens the app (universal) | Opens the web page (see below) |
| Push notification tap              | Opens the app             | Opens the app                  |

Without the app installed, the https link opens the web page, which describes
the group, offers to open the app through the scheme, and links to both stores.

Android App Links are not active yet: the website's `assetlinks.json` still
needs the release key's SHA-256 fingerprint (`eas credentials --platform
android`), and `app.json` then needs the `intentFilters` block listed in the web
repository's `docs/app-links.md`. Until then an Android user reaches the app
through the web page's "Open in app" button.

`ios/` is generated. `app.json` is the source of truth for the associated
domain; a local `ios/` folder picks it up on the next `npx expo prebuild`.
