# Architectural Decision Log

## 2026-07-16 — Expo SDK 57 universal native foundation

- **Context:** A new mobile repository and browser-only visual reference were supplied.
- **Options considered:** copy the web prototype; adopt a UI framework; build native universal primitives.
- **Chosen approach:** Expo SDK 57, Expo Router native Stack, React Native/Expo primitives, incremental internal design system.
- **Consequences:** native behavior/accessibility are first-class; product screens take deliberate translation; fewer dependency/theme constraints.
- **Status:** Accepted.

## 2026-07-16 — Semantic theme with persisted preference

- **Context:** Exact blue/teal/Poppins branding and System/Light/Dark modes are mandatory.
- **Options considered:** hardcoded screen styles; web theme reuse; centralized tokens with runtime fonts.
- **Chosen approach:** identical semantic token keys per mode, Zustand preference persisted in AsyncStorage, native header/status synchronization, Poppins runtime loading coordinated with splash.
- **Consequences:** all screens consume semantics; native rebuild is not needed for fonts; splash is held briefly during font load.
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
