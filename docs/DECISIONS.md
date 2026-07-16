# Architectural Decision Log

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

## 2026-07-16 — Static onboarding content stays release-managed

- **Context:** Welcome and Introduction contain no mutable, user-specific, financial, role-specific, or administratively managed data.
- **Options considered:** create a content API and seed tables; copy the browser implementation; keep typed native content in the release.
- **Chosen approach:** native feature screens with semantic tokens and a local completion preference; no backend persistence or API.
- **Consequences:** both screens work offline and avoid needless backend coupling; copy changes ship with an app release.
- **Status:** Accepted.

## 2026-07-16 — Semantic theme with persisted preference

- **Context:** Exact blue/teal/Poppins branding and System/Light/Dark modes are mandatory.
- **Options considered:** hardcoded screen styles; web theme reuse; centralized tokens with runtime fonts.
- **Chosen approach:** identical semantic token keys per mode, Zustand preference persisted in AsyncStorage, native header/status synchronization, Poppins runtime loading coordinated with splash.
- **Consequences:** all screens consume semantics; native rebuild is not needed for fonts; splash is held briefly during font load.
- **Status:** Accepted.

## 2026-07-16 — Two-stage account verification

- **Context:** Registration requires both Nigerian phone and email ownership without storing raw OTPs or issuing sessions to partially verified accounts.
- **Options considered:** issue a session immediately; use one combined challenge; require phone then email before activation.
- **Chosen approach:** create a pending account, record versioned consent, verify phone then email with separate challenge-bound HMAC digests, and issue a session only after email completes.
- **Consequences:** challenge expiry, attempts, resend cooldown, notification delivery, and account activation are backend-authoritative; production delivery still requires approved providers.
- **Status:** Accepted.

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
