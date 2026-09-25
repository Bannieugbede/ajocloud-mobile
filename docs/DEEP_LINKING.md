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

## Referral links (`/join?ref=AJO-XXXXXX`)

`referral-share.ts` builds these. `app/join/index.tsx` holds the code
(`pending-referral.ts`, 30 days) and sends someone signed out to sign-up, where
the referral field is pre-filled. Someone signed in goes home. The code is
normalised the way the backend does it, and anything that is not a code is
dropped rather than filled in. An invitation link may carry `?ref=` too.
`join/[code]` holds it on arrival, so it counts even if that invitation is
declined.

## After an install from the website

On first launch, Android reads the Play Install Referrer once per installation
(`use-install-attribution.ts`). The website puts
`ajocloud_invite=<code>&ajocloud_ref=<AJO-XXXXXX>` there, so a person who
followed an invitation lands straight on it, with any referral held. iOS has no
equivalent. The website asks the person to return to its tab and tap Open in
the app.

The end of registration (`intent.tsx`) resumes a held invitation the same way
sign-in does, so someone who created an account to accept an invitation is
taken back to it.

## Akawo pool and Food Ajo links (`/akawo/join/<code>`, `/food/<id>`)

Members share these as website links (`src/services/share-links.ts`), because a
website link works for everyone: it opens the app when installed, and otherwise
the website shows the pool or programme and offers to join on the web or get
the app. The pool code screen shares the link and the bare code, for someone
typing it in. The Food programme screen has a Share button while the programme
is `OPEN` or `ACTIVE`, the only states the website's public preview describes.

`+native-intent.ts` redirects both paths, from the scheme or a universal link,
to public entry screens under `/invite`. Left alone, `/akawo/join/<code>` would
match nothing and `/food/<id>` would land on a tab screen that assumes a
session. Only `?ref=` is carried across from the link's query.

| Entry screen                | Signed in                                      | Signed out                                           |
| --------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `invite/akawo/[code]`       | Pool join screen, code filled in and looked up | Pool held, sign in, then the pool join screen        |
| `invite/food/[programmeId]` | The programme's screen in the Food tab         | Programme held, sign in, then the programme's screen |

The held destination (`pending-invitation.ts`) now covers an Ajo invitation,
an Akawo pool or a Food programme, one at a time, for an hour, in SecureStore.
A record saved in the older `{ code }` form still reads as an Ajo invitation.
The Play install referrer carries `ajocloud_pool` and `ajocloud_food` as well,
and opens the matching entry screen on first launch.
