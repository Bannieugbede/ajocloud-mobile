# Ajo Cloud Mobile Engineering Rules

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

These instructions apply to the entire repository. Before changing code, read `README.md`, this
file, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_REFERENCE.md`, `docs/THEME.md`,
`docs/API_INTEGRATION.md`, `docs/SECURITY.md`, `docs/TESTING.md`, and `docs/DECISIONS.md`.

## Product and terminology

Ajo Cloud is a universal Expo mobile client for community Ajo groups, food savings packages,
personal Akawo goals, wallets, payments, and related account flows. The word “Akawo” must always
be used throughout the application, source code, documentation, database seed data, API labels,
tests, navigation titles, screen content, and user-facing messages. The incorrect word “Akawa”
must never be introduced. Run `bun run validate:terminology` before handing off work.

## Mandatory workflow

1. Read this file and the documents listed above.
2. Read the relevant roadmap and feature documentation; confirm the item is pending.
3. Inspect `/web-design` only for layout, hierarchy, data, and flow reference.
4. Read the exact versioned Expo SDK 57 documentation at
   `https://docs.expo.dev/versions/v57.0.0/` before writing Expo code.
5. Implement one coherent roadmap item at a time.
6. Add or update meaningful tests and run the proportional validation commands.
7. Update the roadmap and all affected documentation.
8. Record material architectural decisions in `docs/DECISIONS.md`.

## Platform rules

- Use Expo SDK 57, React Native, strict TypeScript, and Expo Router. Install Expo and native
  dependencies with `npx expo install` after verifying SDK compatibility.
- Build with React Native and Expo universal components. Never import HTML, CSS, DOM APIs,
  browser storage, web routing, Tailwind classes, or browser-first UI packages into the app.
- Prefer Expo APIs when they solve the problem. Do not add a UI framework or dependency without a
  documented cross-platform, accessibility, maintenance, performance, and bundle-size rationale.
- Every mobile screen must use the native Expo Router/React Navigation header by default. Do not
  recreate standard mobile navigation headers using ordinary Views inside the screen body.
  Custom headers require a documented product reason. Centralize shared Stack options.
- Use native Stack and tab navigation, safe areas, scrolling, modals, keyboard handling, Android
  back behavior, gestures, alerts, pull-to-refresh, loading feedback, and accessibility semantics.
- Do not use fixed phone frames or fixed content heights. Support small and large phones, cutouts,
  font scaling, keyboards, and appropriate landscape behavior.

## Design reference and theme

- `/web-design` is an immutable visual and structural reference, not application code. Do not copy
  its implementation or theme. Translate browser patterns to native screens and mobile lists.
- The brand primary is `#0D47A1`, secondary is teal `#15B0B8`, and typeface is Poppins 400/500/600/700.
- Use semantic tokens from `src/theme`; never scatter hardcoded colors through screens. Every
  component must work in persisted System, Light, and Dark modes, including native navigation.
- Build reusable components from demonstrated repetition, with typed composition and purposeful
  variants. Every reusable component must support accessibility, pressed/loading/disabled/error
  states as applicable, both themes, and useful test identifiers when automation needs them.
- If content is genuinely static, keep it static. Do not create an API, database table, store,
  query, mutation, abstraction, or configuration service without a runtime need.

## State, API, and backend boundaries

- TanStack Query owns server state. Zustand owns only durable app-level client preferences and
  small coordination state. React owns local UI state. React Hook Form plus Zod owns validated forms.
- Never mirror Query data into Zustand. Use stable query keys, cancellation, bounded retries,
  pagination, invalidation, and safe optimistic updates only where rollback is reliable.
- Components never hardcode URLs or call ad-hoc API logic. Use the typed client, normalized errors,
  authentication headers, request cancellation, timeouts, trace IDs, and backend validation errors.
- Sensitive mutations such as contributions, payments, withdrawals, and approvals require backend
  authorization and idempotency. Never represent them as complete while offline.
- Do not invent backend contracts or add database code here. Track missing endpoints and realistic,
  non-sensitive seed scenarios in `docs/BACKEND_REQUIREMENTS.md` and
  `docs/SEED_DATA_REQUIREMENTS.md`; coordinate contract changes with the backend team.

## Security, accessibility, performance, and testing

- Store tokens and sensitive values in SecureStore, never AsyncStorage. Expo public environment
  variables are compiled into the app and must never contain secrets.
- Never log tokens, passwords, PINs, OTPs, PII, payment data, or sensitive responses. Validate deep
  links and external URLs, enforce permissions server-side, redact diagnostics, and treat biometrics
  only as a local unlock layer.
- Every interactive control needs an appropriate role, label, state, 48dp target, focus/order, and
  screen-reader behavior. Do not convey status with color alone. Support dynamic text, contrast,
  error announcements, and reduced motion.
- Paginate large data, use FlashList when profiling or scale warrants it, Expo Image for remote
  images, avoid nested virtualized lists and broad stores, and cancel obsolete work.
- Add unit, component, hook, validation, store, error-normalization, navigation, and integration
  tests according to risk. Avoid snapshot-only tests. Run formatting, lint, strict type checking,
  tests, and terminology validation.

## Documentation, status, and definition of done

Use only `NOT STARTED`, `READY`, `IN PROGRESS`, `BLOCKED`, `IN REVIEW`, `COMPLETED`, or `DEFERRED`.
A feature is not complete until its roadmap item, tests, API documentation, architecture notes, and
related implementation documentation have been updated. Completed items record date, summary,
files, tests, validation results, limitations, and follow-ups.

Work is done only when functionality is real (unless explicitly a prototype), routes and native
headers work, backend/loading/error/empty/offline states are handled where applicable, access is
enforced, both themes and accessibility work, tests and `bun run validate` pass, documentation is
synchronized, and no secrets or prohibited terminology were introduced.
