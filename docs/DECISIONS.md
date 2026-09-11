# Architectural Decision Log

## 2026-08-19 — Google sign-in reuses the backend's browser OAuth flow

- **Context:** Google sign-in was required on web and mobile, with one shared flow.
- **Options considered:** a native Google SDK per platform with client-side ID tokens; or the
  backend-owned redirect flow driven from a browser on both clients.
- **Chosen approach:** the backend owns `/auth/google` and `/auth/google/callback`. Mobile opens the
  same URL with `expo-web-browser` (already a dependency) and returns via the `ajocloud` scheme, so
  no Google SDK or new dependency is added and the client secret never leaves the server. Because a
  deep-link URL can be recorded by the OS, the callback hands the app a single-use two-minute code
  which is exchanged for tokens over TLS; the tokens themselves never travel in a URL.
- **Consequences:** consent renders as a browser page rather than native UI, which is the accepted
  cost of one shared flow. Sign-in requires the deep link to be registered on both platforms.
- **Status:** Accepted.

## 2026-08-19 — Introduction carousel reinstated as the signed-out entry point

- **Context:** Product direction reversed the 2026-07-18 removal. New users reached account creation
  with no explanation of what Ajo, Akawo, or food packages are.
- **Chosen approach:** A three-slide swipeable carousel at `/(auth)/onboarding` is the first screen
  on a fresh install and after every sign-out. Completion is stored as one durable AsyncStorage flag
  (`ajo-cloud-onboarding`); sign-out resets it. Slide artwork is drawn with `react-native-svg` from
  theme tokens rather than shipped as bitmaps, so both themes work and no binary assets are added.
- **Consequences:** signed-out entry gains one step and one preference boundary, which the previous
  decision had deliberately removed. `Welcome` is deleted: the carousel now carries that role, and
  the signed-out route resolves to `/(auth)/sign-in` once the introduction has been seen.
- **Status:** Accepted; supersedes the 2026-07-18 decision below.

## 2026-07-18 — Welcome routes directly to account entry

- **Context:** Product direction removed the pre-auth introduction carousel and its first-run local
  completion state.
- **Chosen approach:** Create account and Sign in navigate directly from Welcome to their auth
  routes. The introduction route group, feature screen, AsyncStorage preference, and education
  action are removed.
- **Consequences:** signed-out entry has fewer steps and no onboarding preference boundary. Future
  authenticated setup screens must introduce only the routes and state required by confirmed flows.
- **Status:** Accepted; supersedes the static introduction portion of the 2026-07-16 decision below.

## 2026-07-17 — Email-only account verification

- **Context:** SMS delivery was operationally rejected and product direction changed to email-based
  verification for account creation.
- **Options considered:** retain the two-stage flow; make phone optional but still challenge it; use
  one email challenge before session issuance.
- **Chosen approach:** registration collects no phone number, creates one email challenge, and routes
  directly to email verification. Resend is email-only and login remains email/password.
- **Consequences:** the phone route and API contract are removed; challenge security and SecureStore
  session handling remain unchanged; phone can be collected later only under a separate approved need.
- **Status:** Accepted; supersedes the 2026-07-16 two-stage decision below.

## 2026-07-17 — Local mobile development uses the backend LAN origin

The ignored `.env.local` contains the current workstation LAN origin for physical-device testing.
`localhost` is not used because it resolves to the phone or emulator itself. The value is public,
contains no credentials, and can be replaced when the workstation changes network.

## 2026-07-17 — Native navigation surfaces share screen theme

All root and nested native Stacks consume one theme-aware option set for scene, header, and text
styling. Status-bar icon appearance stays in the root Expo `StatusBar`; it is deliberately not set
through native Stack screen options because that requires per-view-controller iOS configuration.
The Expo native root view background follows the resolved app theme so safe-area edges and navigation
transitions cannot reveal the platform's default white background. Welcome remains headerless because
its own full-screen hierarchy provides the entry context; account forms
and ordinary application routes retain native headers.

## 2026-07-16 — Launch validates but does not invent context

Keep the native splash until fonts, persisted theme, SecureStore session, initial network state,
optional update availability, and routing resolve. Validate an online unexpired session through
`/users/me`; preserve it on offline/transient failure, and clear expired/inactive sessions.
Organization, branch, and refresh routing are not inferred without contracts. Public legal routes
show an explicit unavailable state rather than unapproved legal language.

## 2026-07-16 — Product tabs and truthful Home states

The authenticated primary order is Home, Ajo, Food, Akawo, Profile, implemented as native tabs with
a nested Stack per tab. Home preserves the web-design information hierarchy but consumes only live
profile, wallet-account, and Ajo-group APIs. Prototype balances and activity are never copied. Missing
financial/product contracts render explicit unavailable states and disabled informational actions.

## 2026-07-16 — Expo SDK 57 universal native foundation

- **Context:** A new mobile repository and browser-only visual reference were supplied.
- **Options considered:** copy the web prototype; adopt a UI framework; build native universal primitives.
- **Chosen approach:** Expo SDK 57, Expo Router native Stack, React Native/Expo primitives, incremental internal design system.
- **Consequences:** native behavior/accessibility are first-class; product screens take deliberate translation; fewer dependency/theme constraints.
- **Status:** Accepted.

## 2026-07-16 — Static onboarding content stays release-managed (partially superseded)

- **Context:** Welcome and Introduction contain no mutable, user-specific, financial, role-specific, or administratively managed data.
- **Options considered:** create a content API and seed tables; copy the browser implementation; keep typed native content in the release.
- **Chosen approach:** native feature screens with semantic tokens and a local completion preference; no backend persistence or API.
- **Consequences:** both screens work offline and avoid needless backend coupling; copy changes ship with an app release.
- **Status:** Welcome remains accepted; Introduction is superseded by the 2026-07-18 decision.

## 2026-07-16 — Semantic theme with persisted preference

- **Context:** Exact blue/teal/Poppins branding and System/Light/Dark modes are mandatory.
- **Options considered:** hardcoded screen styles; web theme reuse; centralized tokens with runtime fonts.
- **Chosen approach:** identical semantic token keys per mode, Zustand preference persisted in AsyncStorage, native header/status synchronization, Poppins runtime loading coordinated with splash.
- **Consequences:** all screens consume semantics; native rebuild is not needed for fonts; splash is held briefly during font load.
- **Status:** Accepted.

## 2026-07-16 — Two-stage account verification (superseded)

- **Context:** Registration requires both Nigerian phone and email ownership without storing raw OTPs or issuing sessions to partially verified accounts.
- **Options considered:** issue a session immediately; use one combined challenge; require phone then email before activation.
- **Chosen approach:** create a pending account, record versioned consent, verify phone then email with separate challenge-bound HMAC digests, and issue a session only after email completes.
- **Consequences:** challenge expiry, attempts, resend cooldown, notification delivery, and account activation are backend-authoritative; production delivery still requires approved providers.
- **Status:** Superseded by the 2026-07-17 email-only decision.

## 2026-07-16 — Server/client/secret state separation

- **Context:** The app needs caching, small global preferences, forms, and secure sessions.
- **Options considered:** one global store; component-only fetching; specialized state boundaries.
- **Chosen approach:** TanStack Query for server state, Zustand for small client state, React Hook Form/Zod for forms, SecureStore for tokens, AsyncStorage for non-sensitive preferences.
- **Consequences:** no duplicated entities; explicit provider/service boundaries; backend refresh contract still required.
- **Status:** Accepted.

## 2026-07-16 — Reference remains immutable and excluded from terminology gate

- **Context:** `/web-design` intentionally contains legacy terminology and browser implementation.
- **Options considered:** rewrite the supplied artifact; scan it as shipping code; preserve and translate at the boundary.
- **Chosen approach:** preserve/ignore it, document every mapping, exclude it and designated audit documents from the implementation terminology validator.
- **Consequences:** provenance is retained while shipping source remains clean; future agents must never import reference code.
- **Status:** Accepted.

## 2026-08-19 — Account creation is a resumable step form

- **Context:** Sign-up grew from one screen to a sequence covering details, email verification, a transaction PIN, biometrics, optional identity verification, and an intent picker. A single form could not carry that, and users drop out partway.
- **Options considered:** one long scrolling form; a wizard holding all state in memory; per-step routes with persisted progress.
- **Chosen approach:** one Expo Router screen per step under `(auth)`, with `useRegistrationStore` persisting only which step was reached and whether email/PIN are done. Steps after verification are entered with `replace` and hide the back control, because the account already exists and going back would misrepresent what can still be changed. Progress is counted over the five core steps only, so a user who intends to skip identity verification is not shown a total they will never reach.
- **Consequences:** a relaunch resumes rather than restarts; each step is independently testable; the identity detour can be added later without reshaping the flow.
- **Status:** Accepted.

## 2026-08-19 — The transaction PIN never leaves the device unhashed, and never persists locally

- **Context:** The PIN authorises money movement, so it is a credential in its own right, separate from the password.
- **Options considered:** store the PIN in SecureStore for offline checks; pass it between the create and confirm steps as a route parameter; hold it in memory only and verify server-side.
- **Chosen approach:** the PIN is held in a module-level variable between the two steps and cleared as soon as it is confirmed, then sent once to the backend, which stores an Argon2id digest. It is never written to SecureStore, AsyncStorage, or a route parameter, because navigation params are inspectable in dev tooling and can be restored from disk.
- **Consequences:** confirming a PIN requires connectivity; a relaunch mid-pair restarts at the create step, which the confirm route handles with a redirect. Server-side verification is the only check, so lockout cannot be bypassed by tampering with the client.
- **Status:** Accepted.

## 2026-08-19 — Biometrics unlock a stored session and never replace the PIN

- **Context:** Steps asked for optional Face ID / fingerprint during sign-up.
- **Options considered:** treat a biometric match as authentication against the backend; use biometrics to release the saved session; use biometrics to approve payments.
- **Chosen approach:** biometrics are a local unlock layer only, per the mobile security rules. A successful match releases a session already stored in SecureStore on that device; it is never sent to the backend and never substitutes for the transaction PIN when approving money movement. The prompt is run once at opt-in so the promise is verified before it is made, and device-passcode fallback stays enabled to avoid lockout.
- **Consequences:** no biometric data is read, stored, or transmitted; a device with no enrolment is offered the skip path instead.
- **Status:** Accepted.

## 2026-08-19 — Identity verification deferred pending a backend ADR

- **Context:** Steps f-i require BVN/NIN checks, a Nigerian bank list, and account-name inquiry. The backend has provider _interfaces_ only, and `ajocloud-backend/AGENTS.md` requires an ADR before KYC rules are implemented.
- **Options considered:** build the screens against the mock provider; invent the contracts here; ship the introduction screen and defer the rest.
- **Chosen approach:** ship the introduction listing what will be required, with both paths leading to the intent step for now, and record the missing contracts in `docs/BACKEND_REQUIREMENTS.md`. Nothing pretends to verify anything.
- **Consequences:** the flow is complete and honest today; the detour slots in without reshaping it. The agreed constraint is that the raw BVN/NIN is never persisted — only a masked value and result — so the client must never cache or log the identifier.
- **Status:** Accepted; steps g-i remain BLOCKED on the backend KYC ADR.

## 2026-09-02 — Request timeout raised to 30 seconds

Sign-in was failing against `api.ajocloud.com`. The cause was mostly server-side,
but two client bugs turned a slow backend into an unexplained failure.

Measured against the deployed API on 2026-09-02:

| Endpoint                  | Result                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| `/api/v1/health/live`     | 200, but TTFB 1.2-3.0s for a static JSON object                        |
| `/api/v1/health/ready`    | 503 roughly 1 in 3; when it passes, all three dependencies report `up` |
| `POST /api/v1/auth/login` | 200 in 6-12s; 502 or timeout roughly 1 in 3                            |
| `GET /api/v1/users/me`    | 200 in 32.8s                                                           |
| TLS handshake             | 1.8s                                                                   |

`/health/live` performs no I/O, and the TLS handshake happens before any
application code runs, so a multi-second figure for either is not the API being
slow — it is the host being resource-starved. The marketing site and admin
console on the same origin are equally slow, which rules out anything specific
to this application. Readiness fails intermittently because its per-check budget
is 2 seconds and the host lags past it, not because a dependency is down.

Client changes: the request budget moved from 15s to 30s, a caller-supplied
signal no longer replaces (and thereby disables) the timeout, and an abort is
reported as `timeout` rather than falling through to "something unexpected".

Explicitly not done: the timeout was not raised beyond 30 seconds. `/users/me`
was observed at 32.8s, so some requests will still abort — but a mobile app that
waits a minute on a tap is a worse experience than one that reports a timeout,
and the fix for a 30-second read belongs on the server.

## Swap approvals and notification preferences (2026-09-02)

**`awaitingMyDecision` is computed on the server, not derived in the client.**
Whether a swap needs a particular member's decision depends on who owns the two
affected positions and whether that member has already answered. The client
holds the group's slots and members and could re-derive it, but a divergence
between what the screen offers and what the approve route accepts would show up
as an error the member could not have predicted. One source of truth, on the
side that enforces it.

**Decision buttons are withdrawn once a request's deadline passes.** The screen
checks the deadline as well as the status, mirroring the server rule rather than
mirroring only the stored status. The server refuses an expired request and the
list already reports it as expired, so a live-looking button would produce a
guaranteed failure. `canDecide` holds that rule in one tested place rather than
in the screen body.

**Notification preferences cover product topics only.** Security and
account-recovery messages — verification, sign-in codes, password reset and
change, login alerts, device additions, account locks — are always sent, and the
API does not accept a preference against them. The screen therefore does not
show a switch for them, and says so at its foot instead of leaving a person to
wonder why the list looks incomplete. A switch that silently does nothing is
worse than no switch, and someone who successfully switched off reset mail could
not recover their account.

**The settings screen collapses the topic-by-channel grid into one row per
topic.** The API answers per topic _and_ channel, which is the right shape to
store and the wrong one to read: a person thinks "tell me about payouts", then
chooses how. Quiet hours show "Off" rather than a guess when stored preferences
disagree about the window — picking one row's window and applying it to
everything on save would change settings the person never touched.

**Only EMAIL and SMS are offered.** `PUSH` and `IN_APP` exist in the backend
schema, but nothing delivers on either, and a switch for a channel that never
sends misrepresents what the app does.

## Device registration and push notifications (2026-09-03)

**Registration lives in `saveTokenPair`, not in each sign-in screen.** That
function is the one point every authentication path passes through — password,
OTP and Google — so putting it there means no route can forget to announce the
device. It is deliberately not awaited by the caller: a device that cannot be
registered right now still has a valid session, and blocking navigation on a
push token would make a slow network look like a failed login.

**The fingerprint is generated, not derived from hardware.** Device identifiers
are restricted on both platforms, change across reinstalls anyway, and would
make the record more identifying than it needs to be. An opaque value in
SecureStore is enough to recognise the same installation again; losing it
registers a new device, which is the honest outcome because the app really is a
fresh installation at that point.

**A declined permission still registers the device.** The record is what a
security review of an account reads, and a device nobody knows about cannot be
reviewed or signed out. Being unreachable by push is an ordinary state rather
than an error, so `acquirePushToken` returns null instead of throwing.

**Deep links from notifications are validated before they are followed.** The
link arrives from the server and travels through Apple's and Google's
infrastructure, so following it unchecked would let anything that can forge a
payload send a user anywhere. Only paths under the known tab prefixes are
honoured, and anything carrying a scheme is refused.

**The inbox is reached from Profile rather than becoming a seventh tab.** Six
product tabs already fill the bar; a seventh would crowd them without earning
its place next to Ajo, Food, Akawo and Bills.

**Unread state is a word as well as a dot.** Status must never be carried by
colour or shape alone, and the accessibility label says "unread" so a screen
reader conveys the same thing the dot does.

## Invitation links (2026-09-03)

**An invitation link carries only a code, never a group id.** The public page a
recipient lands on may be opened by anyone the link was forwarded to, so it
describes the group without identifying it. A signed-in caller exchanges the
code for the group id through an authenticated endpoint; nothing addressable
leaks to a stranger holding a forwarded message.

**The code is held in SecureStore across sign-in, not AsyncStorage.** It is a
bearer credential for a place in someone's savings group — anything that can
read it can redeem it — so it is stored the way a token is. It is taken rather
than read, so a held invitation is offered on the sign-in it was held for and
not re-offered on every later one, and it expires after an hour: a code still
sitting there a day later belongs to an abandoned journey, and silently joining
a group would be a surprise rather than a convenience.

**Incoming links are parsed as strings, not through `Linking.parse`.** The value
can be typed, forwarded, or crafted by any page the user visits, so the code
that inspects it should be testable without a native module behind it — under
`jest-expo`, `Linking.parse` is unavailable, which would have left this
untested. Only `/join/<code>` at the exact expected path position is honoured:
scanning for a `join` segment anywhere would accept
`https://anyone.example/x/join/CODE` and hand the app a code as though the user
had been invited.

**Notification taps navigate through `useLastNotificationResponse`, not a
listener.** A notification most often arrives while the app is closed, so the
tap that launches it is the common case — and a listener registered during
render is too late for that. The response identifier is remembered so a
re-render does not navigate again and fight whatever the user did next.

**Universal links are not enabled yet.** `associatedDomains` and
`intentFilters` are deliberately absent from `app.json`: declaring them while
the website serves placeholder association files makes `https://` links fail
silently and in a harder way to diagnose than not claiming them at all. The
custom scheme works today; see `docs/app-links.md` in the web repository for
what has to be filled in first.

## Contribution payment (2026-09-04)

**The contribution screen calls the Ajo settlement route directly, not the
shared payment flow.** That flow's `AJO_CONTRIBUTION` target still throws
"this payment type is not available yet" server-side, so routing a member
through it would have taken them to a dead end. When the shared intent path
grows a working Ajo branch, this should move back onto it.

**Part payment is offered rather than hidden.** Flexible groups collect in
whole units, so owing part of a round is an ordinary state, and someone who can
pay some of it now should not have to wait until they can pay all of it. The
screen offers the remainder rather than the original amount, because re-paying
the full amount would be refused by the server and is not what is owed.

**The screen says the money stays in the group until everyone has paid.** That
solvency rule is the thing most likely to surprise someone — a contribution
that visibly leaves their wallet but does not visibly arrive anywhere — so it
is stated before they pay rather than explained afterwards.

**The idempotency key is generated once per visit, in an effect.** A retry
after a timeout must settle the same contribution rather than a second one.
Generating it during render would be impure — the clock and the random source
both are — and a replayed render would produce a different key each time.

**Paying identifies the contribution schedule, not the slot.** These are
different rows, and the previous handler passed a slot id where a schedule id
was required; it could never have worked, since the schedule endpoint did not
return `id` at all. Both are fixed.

## Home dashboard (2026-09-05)

**Every figure on the dashboard comes from an API.** The wallet balance, the
Akawo savings total, the referral rewards balance, the upcoming schedule and the
recently paid billers are all read from the backend. Phase 5 had been blocked on
exactly these, and the previous screen showed "Balance unavailable" beside four
padlocked actions. Where a figure genuinely cannot be read, the screen says so
rather than showing a zero: an unavailable balance and an empty wallet are
different facts, and a member must never be shown the second when the first is
true.

**Derivation lives in `home-data.ts`, not in the component.** Totals, remainders,
urgency and relative dates are money arithmetic, and a wrong total should fail a
unit test rather than be noticed on a screenshot. `now` is a parameter
throughout, so the boundary between "due soon" and "scheduled" is testable
exactly instead of depending on when the suite runs.

**Upcoming activity is filtered to the viewer's own slots.** A group admin
receives every member's schedule rows from the backend. Rendering them without
filtering would tell an admin they personally owe the entire group's
contributions. The filter is by slot ownership, and a test holds it.

**Only successful bill payments are offered again.** Quick Pay is derived from
payment history because no saved-beneficiary API exists. Re-offering a failed or
reversed payment would imply it had worked, so the filter is `SUCCESSFUL` alone,
one row per customer reference and most recent first.

**Wallet actions are enabled only where an API exists.** Send, Withdraw and Bills
work today. Fund stays locked until the payment provider is wired, and its
accessible label says why rather than presenting a bare padlock. An action that
looks live and then dead-ends is worse than one that explains itself.

**Hiding the balance hides all three figures.** The main balance, savings and
rewards mask together. Hiding only the largest number would defeat the point of
the control for anyone glancing over a shoulder.

**Bills left the tab bar.** The design carries five tabs — Home, Ajo, Food,
Akawo, Profile — which is also the product order the shell already recorded.
Bills is reached from the wallet's Bills action and the Pay Bills section, which
is where someone goes looking for it.

**The screen keeps its data when a refresh fails.** A failed refetch shows a
banner and leaves the last known figures in place, because stale data that is
labelled stale is more useful than a blank screen.

## Product tab screens (2026-09-05)

**Appearance is a three-way choice, not a switch.** The theme store has always
modelled System, Light and Dark and persisted the result, but nothing in the app
called `setPreference` — the theme could not be changed from inside the product.
The Profile row now does, and keeps System as the default so the app follows the
phone unless someone decides otherwise. A plain on/off switch would have removed
that option entirely.

**The referral code is the member's own, not the one they were referred by.**
Those are different values and only one is shareable. Registration now issues a
code to every account and creates the `Referral` row that links a new signup to
whoever referred them — without that row the reward engine had nothing to fire
on, so the whole programme was unreachable.

**Referral earnings are read from released rewards.** The figure on the card and
the figure in the ledger come from the same rows, so they cannot disagree. A
count of invites is shown next to it because a total with no denominator does
not tell a member whether sharing is working.

**Outstanding pool dues are called out above the list.** A due that is missed
because it was three cards down is the failure the Akawo tab exists to prevent.
Only PENDING and PROCESSING dues count as owed: a waived due has been excused by
the organiser, and showing it would ask for money nobody expects. The banner is
absent entirely when nothing is due, because a banner that is always there
trains people to ignore the one that matters.

**Food Ajo separates what you joined from what you could join.** A programme
already subscribed to is not a browsing option, and listing it twice would
suggest a second enrolment was possible. The coordinator banner reads the
member's existing applications rather than inviting everyone every time — an
invitation shown to someone already waiting reads as though their application
was lost.

**Ajo group cards show slots rather than members.** A member holding several
slots fills several places, so counting heads would show a full group as half
empty. The flexible-unit groups are labelled "Variable" and their amount is
described as "My amount", because in those groups the figure is this member's
obligation rather than everyone's.

**Coordinator applications open support, not a form.** There is no in-app
application screen, and building one would collect documents the app cannot
submit. Support can start the process today; the row will point at a real form
when one exists.

## Custom headers on the tab screens (2026-09-05)

**Each tab draws its own header.** This is the documented exception to the rule
that every screen uses the native navigator header, and it is taken for one
reason: each tab already names itself in the first line of its content, so a
title bar above that prints the name twice and costs a fixed strip of height on
a small phone. The header scrolls away with the content instead. Every screen
below the tab root keeps the native header, so back navigation is unchanged.

One `AppScreenHeader` serves all five rather than each screen rolling its own,
because five near-identical headers would drift apart within a month. It carries
an optional eyebrow (Home's greeting), a subtitle, round icon buttons (Home's
theme and notification controls, Profile's settings) and inline buttons (Join and
Create on Ajo and Akawo).

**Bill categories are drawn in their own colours.** Four identical blue tiles are
harder to scan than four coloured ones, and the colour is the fastest way to
find the row you want. The mapping is a tested function rather than a literal in
the card, so the shortcut and the Quick Pay row that follows it cannot disagree
about what Electricity looks like.

**Akawo opens on pools rather than personal goals.** A collection someone else is
running has a deadline and a person waiting; a personal savings goal has neither,
so pools are what the tab should surface. Goals keep their own route, linked from
the top of the pools screen, and the Home wallet still sums them into Savings.

**Food package photographs are real data, not decoration.** `imageUrl` and
`description` are nullable columns on `FoodPackage`, and the card falls back to a
coloured tile when either is absent, so a package without a photograph still
occupies the same shape and the list does not jump as images resolve.

**The coordinator's "Verified" badge means their KYC tier.** It is read from the
same verification every other part of the app uses. A badge that did not mean
anything would be worse than no badge at all, because it would still be believed.

## The session survives a closed app (2026-09-05)

**The refresh token is now actually used.** It was stored from the first day
sign-in existed and never sent anywhere: `refreshToken` appeared in the type, in
the save, and nowhere else. The access token lives fifteen minutes and the
refresh token thirty days, so closing the app over lunch was enough for startup
to find a lapsed access token and delete a session that had twenty-nine days
left. That is the whole of the reported bug, and the reason it looked like
"everything is lost" rather than a slow expiry.

**Refreshes are serialised, because the backend rotates.** Each refresh consumes
its token and issues a new one, and a token presented twice is read as theft:
the session is marked COMPROMISED and every token on it revoked. A cold start
fans out several queries at once, all of which would find the same spent token,
so the naive fix — refresh wherever a token is needed — would have signed people
out harder than the bug it replaced. One in-flight rotation is shared by every
caller that arrives during it.

**Only a refusal ends a session.** A refresh that fails with 401 or 403 clears
the stored session; a refresh that fails on a timeout or a dead radio does not.
Being in a tunnel is not evidence that a thirty-day token has expired, and
treating it as such would sign someone out for boarding a train. Offline at
startup keeps the session and opens the app; the queries behind it still fail
until there is a network, which is the honest state.

**A 401 is retried once with a fresh token.** The stored expiry is only what the
phone believes — a drifted clock or a token revoked from another device both
look valid locally and can be discovered no other way than by being refused.
Once: a second failure is the answer, not a state to loop on.

**The refresh endpoint has its own unauthenticated client.** The shared client
asks the session manager for a token, and the session manager refreshes by
calling the endpoint. Routing that call through the shared client would mean
fetching a token in order to fetch a token.

## Token providers are injected into the API client (2026-09-05)

The first cut of the refresh work had `api-client` importing `session-manager`
for its token providers, while `session-manager` reached `api-client` again
through the endpoint it refreshes with. That is a cycle, and Metro resolves a
cycle by handing whichever module loses the race a partially-evaluated one —
so `ApiClient` was `undefined` at the moment `auth-refresh` called
`new ApiClient(...)`, and the app died before its first screen.

Every unit test passed, because Jest's loader tolerates the same cycle. Only a
real launch found it.

The dependency now points one way: `session-manager` imports the client and
calls `installSessionTokens` at module load, and the client imports nothing
from the session layer. Installation happens at load rather than in a startup
effect so there is no window in which a request goes out unauthenticated
because the wiring had not run yet.

`__tests__/module-graph.test.ts` loads the real modules in a fresh registry in
the order startup uses. Restoring the cycle reproduces the exact production
error — `ApiClient is not a constructor` — which is what makes the test worth
having rather than a formality.

The refresh call now goes through the shared client with an `unauthenticated`
flag instead of a second client instance: it needs no Authorization header, and
refreshing in response to its own 401 would recurse.

## Compact buttons in screen headers (2026-09-05)

Two full-size buttons beside a `fontSizes.title` heading made the Ajo header
top-heavy: 48dp-tall buttons with 24px of horizontal padding each, crowding the
title they belong to and pushing it towards wrapping on a small phone.

`AppButton` gained a `compact` size rather than the call sites overriding its
styles, so the two header pairs cannot drift apart and any future header gets
the same shape for free. The title drops to 18 and the round icon buttons to
38, between body and title size — enough to read as a heading without
outweighing the actions next to it.

**The touch target does not shrink with the button.** `hitSlop` puts back
exactly the height the smaller padding gives up, keeping every control at 48dp.
A test asserts drawn height plus slop rather than the drawn height alone, and
removing the slop fails it — the point being that a design note about density
must never quietly cost reachability.

## Profile matches the design; settings move behind the gear (2026-09-06)

Profile is the member's own summary — who they are, what they hold, and the
things they reach for often. Edit profile, Security, Notification settings and
Privacy & terms are configuration, opened once and rarely again, so they now sit
on a Settings screen behind the header gear rather than lengthening the screen
they are least often wanted on. The gear previously opened Security, which was
arbitrary. Nothing became unreachable, and a test asserts every moved row still
has a way in.

**Appearance keeps all three choices.** The design draws Dark Mode as a row with
a chevron, which a two-state switch would have satisfied — at the cost of
"System", the default and the one most people want, because it follows the phone
at dusk without being asked. The full choice lives on the screen the chevron
opens; the row says which is active.

**Platform Fees states what is true rather than what looks complete.** The
banded fee model is undecided and `feeMinor` is `"0"` on every payment the
backend settles today, so the screen says Ajo Cloud is free to use and names
each product explicitly. Inventing a plausible fee table on a financial screen
would be worse than showing none: members would believe it. The figures live in
`platform-fees.ts` so the summary line and the table are driven from one source
and cannot contradict each other, and rates drop in there when the model lands
without the screen changing.

**`AppListItem` gained `card` and `centered`, `AppAvatar` gained `shape` and
`tone`.** The design separates each menu row onto its own surface and gives the
profile a solid rounded-square mark, which is what distinguishes "this is you"
from the circular avatars used wherever another member appears in a list. Both
went on the shared components rather than being styled at the call site, so the
next screen that wants either gets it without repeating the decision.

## Empty states invite rather than report (2026-09-06)

Every empty state was the same flat bordered box: a 28px grey glyph that read
more like a broken image than an illustration, a semibold line, and a stretched
outline button when there was an action at all. Worse, most had no action —
the Ajo list said "Groups you create or join will appear here" with nothing to
press, while the header above it carried both Create and Join.

`AppEmptyState` now draws a tinted circular medallion, a title at the screen's
own heading size, and a **primary** button rather than an outline one: if an
empty state names an action, taking it is the obvious next thing to do.

**Empty is not one situation, so there are three tones.** `invite` is a list
nobody has added to yet and should look like an opportunity. `neutral` is a dead
end the member cannot act on — no billers in this category, no food programmes
opened near them — and drawing that as an invitation would be a false promise.
`positive` is empty because everything is done. All three used to be the same
grey box, so each read as a failure.

Every call site that has an action now offers it, and the ones that genuinely
have none say so plainly and stay neutral. `compact` exists for an empty section
inside an otherwise populated screen, where the full treatment would dominate
what surrounds it.

The API stayed backwards compatible, so all sixteen call sites kept working
while each was reviewed individually rather than being migrated in bulk.

## The notification inbox (2026-09-06)

The inbox was the thinnest screen in the app: a native header, plain cards, no
icons, no timestamps, a hand-rolled empty panel, and — most consequentially —
no pagination at all. The feed returns a `nextCursor` the screen ignored, so
every notification past the first page was unreachable. It now pages with
`useInfiniteQuery` behind a "Show older" control.

**Category comes from the deep link, not the template.** `template` is a
free-form `VARCHAR(100)` on the backend and only `welcome` is dispatched today,
so matching on template names would be guessing at values that do not exist.
The deep link has to name a real route for the notification to be openable at
all, which makes it the reliable signal; the template is a fallback for entries
that carry no link, and the link wins when the two disagree.

Each category is drawn in the colour of the product it belongs to, so an Ajo
payout and a security alert are distinguishable before either is read.

**Unread is marked three ways** — a tinted row, a dot, and the word "New" — so
the state survives being read without colour. The row is tinted as well as
dotted because an unread entry should be findable while scrolling past it, not
only once it has been looked at directly.

The subtitle deliberately avoids "Nothing yet" when the feed is empty, because
the empty state directly beneath it already says exactly that.

## A crash screen that can be recovered from (2026-09-06)

The error boundary rendered one fixed sentence — "Ajo Cloud could not start.
Please close the app and try again." — with no control at all. One bad render
bricked the app until the member force-quit it, and because the boundary sits
above the theme provider it drew on a system-default background that matched
nothing else in the app.

`CrashScreen` offers a retry, and a full bundle reload once retrying in place
has already failed: a crash during first render tends to repeat on a plain
remount, so offering both at once would ask the member to guess which is the
real recovery.

**It is deliberately standalone.** It renders above the theme store, the query
client and the navigator — any of which may be what failed — so it reads the
colour scheme straight from the system, draws its own buttons rather than
`AppButton`, and imports nothing that could throw on the way in. A crash screen
that can itself crash leaves a white rectangle and no way out.

**It never shows the error.** A stack trace carries whatever the code had in
scope when it failed — a token, an account number, a PIN — and this is the one
screen guaranteed to be seen by someone who cannot be asked for consent first.
What the member gets instead is a short reference built from characters that
cannot be misheard, which means something only when matched against a report the
app sends itself. The reference is random rather than derived from the error: a
hash would be stable, which sounds useful until two members quote the same code.

It also says plainly that their money is safe. Someone whose banking app has
just broken in front of them assumes the worst about their balance first, and
saying nothing invites that.

## Shared query keys for the notification feed (2026-09-06)

Paging the inbox with `useInfiniteQuery` gave it a cached shape of
`{ pages, pageParams }`, while Home and the Settings row kept a plain `useQuery`
caching `{ items, unreadCount }` under the identical key. Whichever populated
the entry first, the other read a shape it did not expect, and the app crashed
on launch — through 627 passing tests, because every screen is rendered in
isolation with its own QueryClient and the two never met.

`src/api/query-keys.ts` now names both spellings next to each other. The paged
key extends the summary key rather than replacing it, so one invalidation on the
shared prefix still refreshes the inbox and the unread badge together after
something is marked read.

## Create and join an Ajo group (2026-09-06)

The create form was four steps of plain text inputs, including a start date
typed as `YYYY-MM-DD`. It is now a four-step wizard with a segmented progress
bar, type cards, chips and a stepper — everything the design shows, in every
place the backend can store it.

**Duration replaces the start date.** The design asks how long the group runs
for, which is what an admin is actually choosing; the group starts today and
`endDate` is derived from duration and frequency. The backend needs both dates
and a typed date that disagreed with the rotation length would create a group
whose schedule does not fit. Start is normalised to midnight UTC, because a
group created at 14:30 should not put every later cycle at 14:30.

**A rotation shorter than its member count is warned about, not corrected.**
Twenty positions on a twelve-month monthly rotation pays twelve people and
leaves eight contributing towards a turn that never arrives. Both numbers are
the admin's to choose, so the screen names the conflict and both ways out rather
than silently changing one of them — but it does not block, because a group may
legitimately be created before all its members have joined.

**The Fees step is not built.** The design asks the admin to set an admin fee
percentage and a defaulter fee. `CreateAjoGroupInput` has neither, `PenaltyRule`
exists but is deliberately unused, and ADR-011 states that default handling
"needs its own ADR, because forfeiting someone's contributions is a rule about
their money and not an implementation detail". Collecting those numbers and
discarding them would create a group on terms the admin was shown and does not
have. The review step says instead that a group cannot set its own fee, and
points at Platform Fees. Grace period is the one field of that step the backend
does store (`gracePeriodMinutes`), so it moved to the Amounts step.

**Joining verifies before committing.** The screen asks for the code alone,
resolves it through `GET /ajo-groups/invitations/:code/group`, and names the
group before asking how many positions to take. A code read aloud or forwarded
is easy to get wrong, and joining the wrong rotation is a commitment of real
money. The group id the old form asked members to type is now resolved for them.

Codes stay in the backend's real format — 32 bytes of base64url — rather than
the short `AJO-XXXXX` the design draws, because that is what the server issues.

**Four new shared components.** `AppChipGroup`, `AppStepper`, `AppToggleRow` and
`AppStepProgress` each appear more than once across these screens, and the chip
and stepper keep a 48dp touch target through `hitSlop` rather than growing tall
enough to dominate a form that has two rows of them.

## Native headers on the tab screens' children (2026-09-06)

Create, Join and the notification inbox use the navigator's header. The tab
roots keep their custom ones — each names itself in its first line of content —
but a screen pushed on top of a tab is a place you came from somewhere else, and
the native header is what carries the back affordance and the platform's own
gesture. The inbox states its unread summary in a line beneath the title
instead, which a title bar has no room for.

## Bills and wallet funding (2026-09-06)

**Saved Bills are derived, not curated.** There is no beneficiaries endpoint, so
a saved bill is the most recent _settled_ payment to a distinct biller-and-
reference pair. That is a better definition than a list someone maintains:
nobody curates a list of their own bills, but everybody pays the same ones every
month. Three months of DSTV is one bill to pay again, not three.

Two details carry weight. A failed payment is never offered for repeat, because
offering it would imply the last one worked. And the key includes the masked
reference, so two meters in one household stay two bills — collapsing them on
biller alone is exactly how a repeat pays the wrong meter.

Repeating a bill prefills the provider and the amount but **not** the reference,
because the history only ever holds a masked one. Asking again is both necessary
and a safeguard.

**Provider, reference and amount are one screen.** They are one decision — an
electricity payment is a meter and a figure — and splitting them made the payer
commit to a provider before seeing what it would cost. Continue does not pay: it
carries the details to the confirmation, where the reference is validated
against the biller and the verified account name is shown before money moves.

**`referenceLabel` has one definition.** A second one briefly existed in
`saved-bills.ts` with different wording, which would have labelled the same field
"Smart Card" on one screen and "Smartcard number" on another. The established
one in `bill-amount.ts` won and gained the categories the design adds.

**Funding the wallet is the one payment the client names an amount for**, because
a top-up has no target row to read one from. `MINIMUM_TOPUP_MINOR` mirrors the
backend's `MINIMUM_DEPOSIT_MINOR` so the payer is told before committing rather
than by a 422, and every quick-select amount clears it — a preset that produced
an error would be worse than not offering it, since the payer did not type it
and cannot see what is wrong. The deposit fee (ADR-009) is stated up front,
because meeting it on the confirmation screen reads as a surprise charge.

`minorToMajor` is new, and round-trips with `majorToMinor` under test: the pair
has to agree or prefilling an amount field would change the amount.

## The notifications header was never drawn (2026-09-06)

`headerShown: false` is set on the whole tabs navigator, because every tab root
draws its own header. Notifications is pushed onto rather than switched to, so
naming it in `Tabs.Screen` was not enough — it had to ask for `headerShown: true`
explicitly. `bills` and `pay` were unaffected: both have their own Stack layouts
that supply headers of their own.

## Screens reached from another tab need a declared back control (2026-09-06)

Expo Router draws a native back button only when a screen was pushed onto the
stack it belongs to. Switching tabs does not push. So Home → Bills, a pool →
the shared payment flow, and Home or Profile → Notifications all arrived with no
history and no back control, leaving the member only the tab bar — which does
not return them where they came from.

`AppHeaderBack` prefers real history and falls back to a declared screen when
there is none, so the ordinary case still behaves like the platform's own back.
`backTo(fallback)` supplies it as screen options along with
`headerBackVisible: false`, because two chevrons on one header is worse than
none: the member cannot tell which returns them where.

The fallback names the screen that logically _contains_ this one, not the one
the member happened to arrive from. Bills and the payment flow are both reachable
from several places, and guessing the caller would be wrong more often than a
stable parent.

Post-submit screens — a receipt, a created group, a payment result — keep their
back suppressed on purpose, because returning to a form that has already been
charged invites a second payment. Each offers its own Done button instead, and a
test asserts that so suppression cannot leave anyone stranded.

## Identity verification serves two callers (2026-09-06)

`/(auth)/verify-identity` is a registration step _and_ the destination of
Profile's "KYC Verification" and "Bank Accounts" rows. Both exits were written
for the first caller only: skipping went to `/(auth)/intent` and completing went
there too, so a member who had been using the app for months was asked what they
wanted to use it for, and the final step called `finish()` on a registration
that was not happening.

`step` on the registration store already distinguishes them — it is null for
anyone not mid-registration — so no parameter has to be threaded through the
four screens of the identity flow. A signed-in member now returns to Profile,
where the badge they just earned is.

## The Akawo pool detail is one screen with two panels (2026-09-06)

Both the organiser's and the member's view of a pool now open on the same
collection hero and switch between an Overview and a Members panel. They had
drifted into two unrelated layouts even though they answer the same question —
how much is in, and who has paid — and the shared `PoolHero` and `AppSegmented`
close that gap.

`AppSegmented` is deliberately not `AppChipGroup`. The chip group picks a value
inside a form and announces itself as a radio group; this picks which panel is
on screen and announces a tab list. Reusing the chip group would have told a
screen reader a value had been chosen when what actually happened is that the
page changed.

### What "Partial" became

The mockups show a third tally beside Paid and Pending labelled "Partial". The
API has no such state: `AkawoDue.status` is `PENDING | PROCESSING | PAID |
WAIVED`, a due is settled in full or not at all, and there is no field carrying
a part-payment. Inventing one would have meant showing an organiser an amount
nobody had recorded.

The tile shows **Processing** instead — a payment already in flight, which is a
real state the API returns and the one an organiser genuinely needs to tell
apart from someone who has not paid at all. If part-payment is wanted as a
product, it is a change to what a due means and needs a backend ADR first.

### Waived members are in no tally

Paid, Pending and Processing deliberately exclude waived and removed members.
The organiser has excused a waived member, so they are neither owing nor money
collected; a removed member has left the collection entirely. Counting either
would misstate what is still to come in. Both still appear in the list, so
nobody vanishes without trace.

### The member's target is derived, not fetched

`MemberPoolView` returns `collectedMinor` and `memberCount` but no target, so
the member's progress bar had no denominator. Every member of a pool pays the
same amount — the rule the create form enforces — so `expectedTotalMinor`
multiplies the two in `BigInt`. The organiser's endpoint still supplies its own
`expectedMinor` and that is used unchanged where it exists.

## Pool deadlines are read back in UTC (2026-09-06)

A deadline is stored as the last instant of its day in UTC. Formatted in local
time that instant belongs to the _next_ date for anyone east of Greenwich, so a
pool due the 13th was displayed to every member in Lagos as the 14th — a day of
grace nobody agreed to, on the screen that tells people when their money is
late.

`deadlineLabel` and `dueDatePreview` now format with `timeZone: 'UTC'`, the same
frame the value is built and stored in, and a test pinned to `Africa/Lagos`
fails if the option is removed.

## Support does not promise a chat it does not have (2026-09-06)

The Help & Support design shows two channels: "Live Chat — Avg. reply: 2 min"
and "Call Us — Mon–Fri, 8am–6pm". Neither exists. There is one support endpoint,
`createSupportInquiry`, which files a message that is answered by email, and
there is no phone number anywhere in the app's configuration.

Both tiles are built, but they say what actually happens: "Message us — we reply
by email", and an "Email support" tile that opens the address from
`EXPO_PUBLIC_SUPPORT_EMAIL`. Where no address is configured, the tile renders as
plain text rather than a button, so it never looks like a channel that will
open.

A promised two-minute reply that is really an email is the kind of detail
someone plans around when a payment has gone wrong. A test asserts the words
"Live Chat" and "2 min" appear nowhere on the screen, so the promise cannot come
back by accident. Adding either channel later means adding the channel first.

### FAQs are static

Seven answers, held in `support-faqs.ts` rather than fetched. They are product
facts, not data, and a member reading them has often opened the screen precisely
because something is not working — an endpoint would be unavailable exactly when
it was needed.

The admin-fee answer states that nothing is currently charged and points at the
Platform Fees screen, per ADR-009. It quotes no figure, because a fee stated in
two places is a fee that will eventually disagree with itself.

## Transaction History is its own screen (2026-09-06)

Profile's "Transaction History" row opened `/(tabs)/profile/wallets` — the
wallet balance screen, with an unstyled list of recent activity below it. The
row promised a history and delivered a balance.

It now opens a real history built on `getWalletTransactions`, with the wallet
screen left as it was: it is still where funding, sending and withdrawing
return to, and it answers a different question ("what have I got?" rather than
"where did it go?").

### The totals count only settled movements

Total In and Total Out sum movements whose status is `SUCCESSFUL`. A pending
credit has not arrived and a failed one never will, so including either would
tell someone they have been paid when the money is not there. Unsettled
movements still appear in the list, badged, because hiding them would be worse —
that is where someone looks for a payment that has not landed.

The totals also describe the whole account rather than the current filter.
Recomputing them per filter would show "Total Out: ₦0.00" while Money In is
selected, which is not true of the wallet.

### Categories are read from the description

The ledger returns free text, not a typed category, so `categoryOf` matches on
it to choose an icon. Food is tested before Ajo deliberately: "Food Ajo"
contains "Ajo", and without the ordering every food package would be filed as a
rotating-savings contribution. Anything unrecognised is `other` and lists
normally — a movement that cannot be categorised is still the member's money and
must never be hidden.

## The joined pool list needed a backend field (2026-09-06)

The Akawo tab's design shows every card the same way — amount, members, due
date, a progress bar and "2/3 paid · ₦6,000 collected" — whether the member
organises the pool or has joined it. `GET /akawo/pools/joined` returned only the
pool and the member's own due, so a joined card could show what was owed but not
whether anyone else was paying.

`listJoined` now runs the same `withTotals` aggregation `listOrganised` already
did. It exposes nothing new about anybody: a member count, a paid count and a
sum, which is exactly what that member's own detail view (`GET /pools/:id`)
already returned for the pool they are in. Who has paid stays in the organiser's
view, and a backend test asserts the joined payload carries no roster and no
organiser account id.

This is a read shape, not a financial rule, so it needs no ADR — nothing about
what is owed, charged or paid out changed.

### One card, two callers

`OrganisedPoolCard` and `JoinedPoolCard` are now one `PoolCard` with different
props. They had drifted — the joined card showed a reference label where the
organiser's showed a member count, and only one had a progress bar — despite the
design drawing them identically. The only real difference is the badge: an
organiser is told the pool's state, a member is told their own.

A pool with no members draws no progress bar. A bar over zero can only ever read
empty, which looks like a stalled collection rather than a new one.

## One component per visual pattern (2026-09-06)

Bringing the remaining screens up to the new designs meant first stopping the
duplication that made "update the design" a multi-file job. Before this, six
screens drew their own brand hero, six their own medallion, five their own
status pill, three their own metric row, and four their own date formatter.

They had not merely been copied — they had _drifted_. The pills used three
different font sizes; the metric rows disagreed on label casing; the medallions
came in three sizes and two corner radii; and, most seriously, only some of the
date formatters passed `timeZone: 'UTC'`, so the same deadline read differently
depending on which screen you were looking at.

The shared set is now:

| Pattern                                | Component                                                  |
| -------------------------------------- | ---------------------------------------------------------- |
| Brand panel at the top of a screen     | `AppHero`                                                  |
| Status pill                            | `AppBadge` (optional leading icon)                         |
| Labelled facts across a card           | `AppMetricRow`                                             |
| Headline counts in tiles               | `AppStatTiles`                                             |
| Large tinted glyph                     | `AppMedallion`                                             |
| Switching between panels of one record | `AppSegmented`                                             |
| Dates                                  | `src/utils/dates` — `longDate`, `shortDate`, `dateAndTime` |

A feature composes these and supplies only its own wording. `PoolHero` is the
model: it decides how a collection's numbers are phrased and delegates the
surface entirely.

### What deliberately stayed separate

- **`AppSegmented` is not `AppChipGroup`.** The chip group picks a value inside
  a form and announces a radio group; the segmented control picks which panel is
  on screen and announces a tab list.
- **`AppStatTiles` is not `AppMetricRow`.** Tiles have their own bordered
  surface, for a row that sits directly on the page. The metric row is flat, for
  facts inside a card that already has a surface — a second box inside the first
  reads as clutter.
- **Notifications keep their own `dayLabel`.** "Today" and "Yesterday" are
  relative to the reader's own calendar, so that one is local time on purpose.
- **The unread dot and the registration document step** match the brand-fill
  search but are not heroes, and were left alone.

### Tone names, not colours

Every shared component takes a tone (`success`, `warning`, `info`, `error`,
`neutral`) rather than a pair of colours from the caller. The bill receipt's
outcome map was the last place a screen chose success and error colours by
hand. A palette change now lands everywhere at once, and no screen can invent a
sixth shade of "warning".

## The identity screens name themselves (2026-09-06)

The auth stack sets `headerTitle: () => <Logo />` in its `screenOptions`, which
applies the brand mark to every screen in it. That is right for sign-in and
registration — there is no other context to give someone before an account
exists — but the five identity screens are also reached from Profile's "KYC
Verification" and "Bank Accounts" rows.

A signed-in member tapping a named row landed on a header reading "Ajo Cloud"
rather than the name of the screen they had just asked for. Those five now carry
their own titles.

`headerTitle` has to be cleared _explicitly_ on each, not merely omitted: an
element inherited from `screenOptions` beats a `title` string, so a title alone
would still have rendered the mark.

`__tests__/screen-titles.test.tsx` walks every stack and asserts each route file
is declared with a title. That guards the wider version of the same bug: a route
added without a `Stack.Screen` beside it silently falls back to `app.json`'s
`name`, and nothing in a typecheck or a lint notices.

## The wallet and the transaction history are different questions (2026-09-06)

The wallet screen answers "what have I got?" — balance, the three actions, and
just enough recent activity to confirm the last thing that happened. Transaction
History answers "where did it go?" — every movement, filtered, with running
totals. They were briefly the same screen, which is why Profile's "Transaction
History" row used to open the wallet.

The wallet shows five movements and a link. Printing the full history there
would push the balance — the reason the screen exists — off the top.

### Reserved funds are stated, not hidden

A pending withdrawal moves money out of the available balance before it
settles. Showing only the available figure makes the balance appear to drop with
the money nowhere, which reads as a wallet that has lost track of someone's
funds. The screen names the held amount and explains why it is held.

## The coordinator application is a real form (2026-09-07)

The Food tab's "Apply" button routed to Support. That was a deliberate stand-in
from when the screen was built — there was no form, and inventing one would have
collected details nothing could submit — but the backend module has been there
all along: create a draft, update it, submit it for review.

It is now five steps: contact, business, location, settlement, review. One long
form would ask someone for a phone number, a trading address, delivery areas and
a bank account on one screen, and a validation failure at the bottom should not
send them back through the top.

### The step boundaries follow what the backend stores

Each step fills one of the four JSON columns, so a step that validates maps to a
column that is complete. The keys are documented in
`docs/BACKEND_REQUIREMENTS.md`, because nothing server side constrains them and
a reviewer reads them by name.

### The business step is entirely optional

An individual can coordinate. Requiring a CAC registration number would exclude
exactly the people this product exists for. The one combination rejected is a
registration number with no business name behind it, which is incoherent rather
than merely sparse.

### The account number is masked in the form, not at the boundary

`settlementAccountMasked` is the only account column, so `toApplicationRequest`
masks to the last four digits before the body exists. Masking later — in the
client, in an interceptor — would mean the raw number briefly lived in an object
that could be logged or retried. A test asserts the digits typed do not appear
anywhere in the serialised request.

### Consents are validated client-side even though the backend checks them

`submit` returns 422 without `verificationConsentAt`, `termsAcceptedAt` and both
settlement fields. Letting someone reach the button without them would spend
five steps of their time to produce an error the form already knew about.

### Tier 3 KYC is stated before applying, not discovered at rejection

Approval requires verified Tier 3 KYC, which is a separate journey through
Profile. The review step says so, because finding out after a compliance review
that you were never eligible is the worst way to learn it.

## The Food detail screen, joined and not joined (2026-09-07)

Both states are one screen. Everything above the fold is shared — the
photograph, the coordinator and their verification, and the four facts that
decide whether to join — because browsing a programme and being in one ask the
same question first. What differs is the action at the bottom and, once joined,
a second panel.

`AppImageHero` is new and deliberately separate from `AppHero`: one is a
photograph with the title laid over it, the other a brand-coloured panel for a
figure. The scrim is a gradient rather than a flat overlay, because a photograph
can be light or dark anywhere and only a gradient keeps white text legible
without dimming the whole picture.

The navigator header is off for this route — the artwork runs under the status
bar, and a header on top would draw the name twice — so the screen supplies its
own floating back control. It appears in the loading and error states too:
without it, a programme that fails to load leaves only the tab bar.

### "My Progress" is not built, and that is the point

The design shows a progress bar at 60% under a "Payment Schedule" tab. There is
no Food contribution model on the backend — no payment records, no schedule,
nothing on `FoodSubscription` but status, quantity and fulfilment method. The
percentage would have been invented.

The tab ships stating what is known from the enrolment itself — package,
portions, contribution amount and frequency, how they collect, next distribution
— and says plainly that payments are not tracked yet. A test asserts no
percentage appears there, so the figure cannot creep back in later without
someone deciding to.

What the backend needs is written down in `docs/BACKEND_REQUIREMENTS.md`.

### The join button always says why it is disabled

`joinBlockedReason` returns the reason or null, and the screen renders it under
the button. Fullness is reported before status, because "every spot has been
taken" is more useful than "not taking members", and an `ACTIVE` programme says
buying has already started — which explains why a programme that looks live will
not accept anyone.

### A package choice appears only when there is a choice

One package is the programme, not a decision. With several, the chosen one
drives the hero image, the contents list and what is joined.

## Home hero (2026-09-11)

### The hero carries one figure

The redesign sample leads with a single large number. The old wallet card led
with the balance and then stacked savings and rewards inside the same panel, so
three figures competed for the position the eye lands on first.

The hero now states the spendable balance and nothing else, at `display` size,
captioned "Available to spend" — the balance is not everything the member owns,
and a headline figure that could be read either way is worse than a smaller one
that cannot. Savings and rewards moved onto cards below Quick Actions rather
than off the screen: they are still the member's money. All three mask together
on the privacy toggle, which a test pins at three hidden balances.

### The growth pill in the sample was not built

The sample shows "+12.4%" against "vs last month". Nothing in the API returns a
previous-month balance, so the percentage would have been invented — on the one
figure a member is most likely to act on. The pill is omitted until an endpoint
supplies the comparison; the requirement is recorded in
`docs/BACKEND_REQUIREMENTS.md`.

### Fund is enabled on Home because the flow exists

Home passed no `onFund`, so the screen fell back to a locked tile reading
"Funding opens when card and transfer payments go live." Meanwhile
`/(tabs)/profile/wallet/fund` was built, the Wallets screen offered it
unlocked, and `WALLET_TOPUP` is a real payment target. Home was the only place
still showing the lock.

It now routes like every other action. The caveat behind the original wording
is real — an external card or transfer top-up reaches `PROCESSING` and stays
there until the Monnify webhook handler is written — but that is a limit of the
payment method, surfaced inside the payment flow where the method is chosen,
not a reason for Home to refuse to open the screen. Wallet-funded payments
settle today.

### Actions are a section, not part of the card

The four wallet actions were tiles on the brand fill inside the card. They now
sit under a "Quick Actions" heading on the page, drawn in theme tokens like
every other control, so the card holds balances and the section holds verbs.
The four share one horizontal card, which groups them as a single set of things
to do rather than four floating targets. A locked action keeps its position in
the row — reordering as availability changes would move a target out from under
whoever was reaching for it.

### The primary is navy, and pressed goes lighter

The brand primary moved from `#0D47A1` to `#0D1B3D` (2026-09-11). The new value
is near-black, which inverts one assumption in the scale: `primaryPressed` can
no longer be a darker shade, because darkening near-black is not visible. It is
now a lighter step (`#1B2B52`), and `blue700` is kept as the deepest step for
gradients. White on the new primary measures 16.9:1.
