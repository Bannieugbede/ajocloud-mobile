# Architecture

## Principles and boundaries

The app is a universal Expo SDK 57 application with native mobile behavior. Expo Router owns route
composition; feature modules own domain UI and orchestration; the API layer owns transport; and
providers connect infrastructure without turning it into component-global state. Browser code in
`/web-design` never crosses the application boundary.

The repository grows only as implementation needs become real:

```text
src/app              route files and layouts (thin composition)
src/features         domain screens, hooks, schemas, query definitions
src/components/ui    domain-neutral accessible primitives
src/components       shared composed feedback/navigation elements
src/api/client       transport and normalized errors
src/api/endpoints    backend contract adapters, created per confirmed contract
src/config           validated public configuration
src/providers        root infrastructure providers
src/services         device and secure persistence boundaries
src/store            small global client state only
src/theme            brand and semantic design tokens
src/types            cross-cutting application types
src/utils            pure cross-cutting functions
```

Folders are created when they have implementation, not to mirror an aspirational tree.

The first product routes now use `(auth)` and `(onboarding)` nested native Stacks. Their route files
only compose feature screens and navigation callbacks. Static introduction completion crosses the
device boundary through `src/services/onboarding-preferences.ts`; it remains separate from server
state and sensitive session storage.

## Navigation

The root `_layout.tsx` loads fonts, holds the splash, mounts error/Query providers, synchronizes
native status/header colors, and declares a native Stack. Planned route groups are `(auth)`,
`(onboarding)`, `(tabs)`, and `(modals)`, with nested stacks for Ajo, food plans, Akawo, wallet, and
profile. Route files remain thin and use shared header presets. Guards resolve authentication,
verification, onboarding, organization/branch selection, role, and permission in that order.
Authorization is still enforced by the backend. Deep links and notifications first parse an
allowlisted route intent, restore session state, apply guards, then navigate—avoiding redirect loops.

## State and data flow

- TanStack Query owns fetched records, cache freshness, pagination, mutations, cancellation, and
  invalidation. Query keys are arrays ordered from broad resource to stable filters/identity.
- Zustand owns small cross-route client choices such as theme preference, session metadata, and
  selected organization. It never duplicates response entities.
- React state owns transient screen interaction. React Hook Form and Zod own non-trivial forms.
- AsyncStorage persists non-sensitive preferences. SecureStore persists tokens and other secrets.

The API client injects authentication, timeouts, cancellation, JSON handling, request/trace IDs,
and idempotency keys. It maps transport/backend failures to `AppError`. Refresh coordination will
use one in-flight refresh promise after the backend contract is known; failed refresh clears secure
session material and returns to sign-in without logging tokens.

## Theme and components

`src/theme` exposes brand palette, semantic light/dark tokens, Poppins families, spacing, radii, and
minimum targets. The persisted preference is System/Light/Dark; the resolved mode drives content,
native Stack headers, tab bars, modals, and status bar. UI primitives compose React Native controls
with accessibility and state variants. Domain components appear only after repeated structures are
confirmed—for example `AjoGroupCard`, `FoodPackageCard`, `AkawoGoalCard`, and `TransactionCard`.

## Errors, connectivity, and offline behavior

The root error boundary handles unrecoverable render failure; screen/query states handle recoverable
failures. Error UI exposes a safe message, retry where appropriate, and trace ID for support.
Expo Network updates Query's online manager. Reads may show cached data with stale/offline status.
Writes are individually classified; financial, approval, membership, and identity writes never
pretend to succeed offline. Future queued writes require explicit conflict, expiry, and disclosure
design.

## Notifications and device capabilities

Notification registration is permission-driven after value is explained, stores backend device
registrations per install/user, handles foreground display separately, and routes only allowlisted
payloads. Camera, image/document picker, biometrics, sharing, clipboard, and haptics sit behind
services so permissions, errors, and platform behavior remain testable. Biometrics unlock local
credentials; it does not authenticate a user to the backend.

## Security boundaries

The device is untrusted. Backend authorization, validation, ledger integrity, rate limits, and
idempotency remain authoritative. The client protects stored tokens, validates input and deep links,
redacts logs, constrains external URLs/uploads, and minimizes sensitive display. See `SECURITY.md`.

## Testing and performance

Pure policies/schemas are unit tested, stores/hooks and API adapters integrated at module level,
components tested through accessible behavior, and critical flows eventually exercised in E2E
development/release builds. Large lists use pagination and FlashList when scale warrants; remote
media uses Expo Image; obsolete fetches are cancelled; expensive work stays out of render; and
reduced-motion preferences disable nonessential animation.

The `(tabs)` route group owns the native tab shell. Only the authenticated Account landing route is
registered today; Home/Ajo/Food/Akawo/Profile tabs will be added with their real data contracts rather
than placeholders. Auth routes use React Hook Form/Zod locally, TanStack Query mutations for server
state, typed endpoint adapters, and SecureStore for returned token pairs.
