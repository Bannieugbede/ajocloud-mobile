# Architectural Decision Log

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
