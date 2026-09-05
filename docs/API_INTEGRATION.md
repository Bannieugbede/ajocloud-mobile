# API Integration

## Launch initialization

A restored session whose access token has lapsed is refreshed before anything else, via
`POST /api/v1/auth/refresh`. The access token lives fifteen minutes and the refresh token thirty
days, so a lapsed access token says nothing about the session behind it; only a refusal from that
endpoint clears stored credentials. Offline, a lapsed token is kept rather than discarded, since it
can be neither renewed nor disproved.

`GET /api/v1/users/me` then validates the session. It requires Bearer authentication and returns
current user/profile/status. `ACTIVE` enters the authenticated shell; inactive status clears
credentials. Transient failure preserves the local session so protected queries can re-evaluate it.

Welcome, Terms, and Privacy use no API. Missing approved legal content is explicit, never invented.
Missing contracts: onboarding status, and organization/branch context.

## Authenticated shell and Home

- `GET /api/v1/users/me`: greeting/profile identity.
- `GET /api/v1/wallets`: owner wallet list.
- `GET /api/v1/wallets/:walletId/summary`: posted-ledger available and reserved balances.
- `GET /api/v1/wallets/:walletId/transactions`: the latest 50 owner-scoped ledger entries.
- `GET /api/v1/ajo-groups`: member Ajo preview.

Missing Home contracts: wiring the new wallet summary into Home, upcoming contribution/payout activity,
Akawo summaries, unread notification count, dashboard partial-error semantics, and all wallet
fund/send/withdraw mutations.

## Ajo and Food product reads

- `GET /api/v1/ajo-groups` and `GET /api/v1/ajo-groups/:groupId` power member listing/detail.
- `GET /api/v1/food-ajo/programmes?limit=25` and
  `GET /api/v1/food-ajo/programmes/:programmeId` power Food listing/detail.
- Amounts remain minor-unit strings. No join, payment, or contribution action is enabled without its
  complete server contract.

## Akawo and wallet reads

- `GET /api/v1/akawo/goals` and `GET /api/v1/akawo/goals/:goalId` power Akawo list/detail and
  return minor-unit strings plus server-derived progress.
- `POST /api/v1/akawo/goals/:goalId/schedules` creates a future savings schedule for an active goal;
  schedule execution and manual deposit money movement remain unavailable.
- Wallet summary and transaction history power `/(tabs)/profile/wallets`. Fund, send, withdraw,
  transaction receipt, and pagination contracts are still missing and therefore have no enabled UI.

## Configuration and client

`EXPO_PUBLIC_API_BASE_URL` is parsed at startup and must be an absolute URL; it is intentionally
optional until the backend contract is supplied. The local physical-device configuration uses the
backend workstation's LAN origin rather than `localhost`; endpoint paths continue to include
`/api/v1`. Public values are not secrets. Components consume feature hooks, not the base URL or
`fetch` directly. `ApiClient` applies JSON headers, a 15-second default timeout, cancellation,
optional bearer token and idempotency key, and captures backend request IDs. Multipart upload will
use a dedicated method so JSON headers are not forced.

## Authentication and refresh

Access and refresh tokens live in SecureStore. `src/services/session-manager.ts` owns the exchange:
it attaches the access token, refreshes one before it lapses, and coordinates exactly one rotation
across concurrent callers. That last point is a correctness requirement rather than an optimisation
— the backend rotates on every refresh and treats a token presented twice as theft, marking the
session `COMPROMISED` and revoking every token on it.

`POST /api/v1/auth/refresh` takes `{ refreshToken }` in the body for bearer clients and returns a
full token pair; both halves are stored, since keeping the old refresh token would break the next
rotation. A 401 is retried exactly once with a freshly refreshed token, which is the only way to
discover a drifted clock or a token revoked from another device. A refusal (401/403) clears the
session; a network failure does not. Tokens and sensitive payloads are never logged.

## Errors

Responses normalize to network, authentication, authorization, validation, not-found, conflict,
rate-limit, server, maintenance, or unknown application errors. Preserve safe message, status,
backend code, field errors, retry-after, and trace ID. UI copy must not reveal internals. Validation
errors map to form fields, while unknown/global errors use an alert region and retry when safe.

## Query conventions

Keys are stable arrays such as `['ajo-groups', organizationId, filters]`. List responses require
cursor or page metadata rather than returning every record. Search is debounced and cancelled;
sorting/filtering are server-side for large collections. Reads retry twice except authentication and
validation failures. Mutations do not retry by default. Invalidate the smallest affected key set;
optimistic updates require deterministic rollback.

Cached reads may remain visible offline with a stale label. Payments, withdrawals, approvals,
contribution confirmations, KYC, and membership changes are blocked offline. On reconnect, Query
may refetch active stale reads; mutation replay is never globally enabled.

## Sensitive operations, uploads, and tracking

The backend supplies idempotency guarantees for financial creates, confirms, and withdrawals. The
client generates a unique key per user intent and retains it through safe retries. Uploads validate
type/size before transfer, use Document/Image Picker URIs, expose progress/cancellation where
supported, and never trust extensions. Analytics records screen/action outcomes with opaque IDs,
not financial details or PII. Endpoint readiness is tracked in `BACKEND_REQUIREMENTS.md`.

## Welcome

`/(auth)/welcome` is a release-managed, static/local screen. It makes no network request, requires no
authentication, remains fully available offline, and routes directly to Register or Sign in. No API,
cache, retry, idempotency, audit, notification, pagination, database model, seed record, or local
completion preference is appropriate for this screen.

## Authentication contracts implemented 2026-07-16

| Screen        | Method and path                         | Request                                                                      | Response and behavior                                                                                                           |
| ------------- | --------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Register      | `POST /api/v1/auth/register`            | first/last name, normalized email, password, required terms/privacy booleans | Opaque user ID, `EMAIL` challenge metadata, masked email, expiry/cooldown, delivery status; public, rate-limited, conflict-safe |
| Verify email  | `POST /api/v1/auth/verify-email`        | user ID and six-digit code                                                   | Activates account and returns access/refresh tokens plus access expiry; public pending-account scope, attempt/expiry limited    |
| Resend        | `POST /api/v1/auth/resend-verification` | user ID                                                                      | Invalidates the prior email challenge and returns new masked metadata; cooldown and endpoint throttling apply                   |
| Sign in       | `POST /api/v1/auth/login`               | normalized email and password                                                | Generic credential failure; active email-verified accounts receive a rotating-session token pair                                |
| Account shell | `GET /api/v1/users/me`                  | bearer access token                                                          | Safe current-user/profile projection for the authenticated tab landing screen                                                   |

OTP values never enter Query caches, Zustand, AsyncStorage, logs, route parameters, notification
payloads, or analytics. Access and refresh tokens are written to SecureStore before navigation.
