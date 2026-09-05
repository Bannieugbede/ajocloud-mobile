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
