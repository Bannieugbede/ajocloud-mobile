# API Integration

## Launch initialization

`GET /api/v1/users/me` validates an unexpired restored access token when online. It requires Bearer
authentication and returns current user/profile/status. `ACTIVE` enters the authenticated shell;
inactive status clears credentials. Transient failure preserves the still-unexpired local session so
protected queries can re-evaluate it. Expired sessions are cleared.

Welcome, Terms, and Privacy use no API. Missing approved legal content is explicit, never invented.
Missing contracts: startup refresh rotation, onboarding status, and organization/branch context.

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

Access and refresh tokens live in SecureStore. Once confirmed, the client will attach the access
token, coordinate exactly one refresh for concurrent 401s, rotate stored tokens atomically, retry an
eligible request once, and clear session on terminal refresh failure. Login, refresh, and logout
payloads must come from backend documentation; tokens and sensitive payloads are never logged.

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
