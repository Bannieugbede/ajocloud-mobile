# API Integration

## Configuration and client

`EXPO_PUBLIC_API_BASE_URL` is parsed at startup and must be an absolute URL; it is intentionally
optional until the backend contract is supplied. Public values are not secrets. Components consume
feature hooks, not the base URL or `fetch` directly. `ApiClient` applies JSON headers, a 15-second
default timeout, cancellation, optional bearer token and idempotency key, and captures backend
request IDs. Multipart upload will use a dedicated method so JSON headers are not forced.

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

## Welcome and Introduction

`/(auth)/welcome` and `/(onboarding)/introduction` are release-managed, static/local screens. They
make no network request, require no authentication, and remain fully available offline. Introduction
completion is a non-sensitive boolean in AsyncStorage. No API, cache, retry, idempotency, audit,
notification, pagination, database model, or seed record is appropriate for these screens.

## Authentication contracts implemented 2026-07-16

| Screen        | Method and path                         | Request                                                                                    | Response and behavior                                                                                                                 |
| ------------- | --------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Register      | `POST /api/v1/auth/register`            | first/last name, normalized email, `+234` phone, password, required terms/privacy booleans | Opaque user ID, `PHONE` challenge metadata, masked destination, expiry/cooldown, delivery status; public, rate-limited, conflict-safe |
| Verify phone  | `POST /api/v1/auth/verify-phone`        | user ID and six-digit code                                                                 | Consumes phone challenge and returns the created `EMAIL` challenge; public pending-account scope, attempt/expiry limited              |
| Verify email  | `POST /api/v1/auth/verify-email`        | user ID and six-digit code                                                                 | Activates account and returns access/refresh tokens plus access expiry; public pending-account scope, attempt/expiry limited          |
| Resend        | `POST /api/v1/auth/resend-verification` | user ID and `PHONE`/`EMAIL` channel                                                        | Invalidates the prior challenge and returns new masked metadata; cooldown and endpoint throttling apply                               |
| Sign in       | `POST /api/v1/auth/login`               | email and password                                                                         | Generic credential failure; active accounts receive rotating-session token pair                                                       |
| Account shell | `GET /api/v1/users/me`                  | bearer access token                                                                        | Safe current-user/profile projection for the authenticated tab landing screen                                                         |

OTP values never enter Query caches, Zustand, AsyncStorage, logs, route parameters, notification
payloads, or analytics. Access and refresh tokens are written to SecureStore before navigation.
