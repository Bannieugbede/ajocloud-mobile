# Backend Requirements

## Public entry and initialization gaps

- Existing and used: authenticated `GET /api/v1/users/me` with status and profile.
- Required: single-flight refresh-token rotation contract with reuse detection and definitive invalid
  session errors.
- Required for organization-aware routing: selected organization, branch, roles, permissions, and a
  fallback when previous context is removed.
- Required for later guards: authoritative onboarding and verification-step status.
- Not required: APIs/tables for fixed Welcome or legal presentation. Legal acceptance continues to
  use existing versioned registration consent records.

## Home dashboard gaps

- Authoritative wallet summary with available/reserved/savings/reward balances serialized as
  minor-unit strings with currency.
- Upcoming contribution, payout, food distribution, and Akawo schedule feed.
- Akawo goal summary/list service backed by the existing schema and ledger.
- Unread notification count and guarded notification destinations.
- Idempotent, authorized wallet funding, transfer, withdrawal, and history contracts before Home
  quick actions can be enabled.

The sibling `ajocloud-backend` NestJS/Fastify/Prisma service was inspected on 2026-07-16. It exposes
versioned registration, login, rotating refresh, logout, and logout-all endpoints, but verification,
password recovery, device management, and full onboarding endpoints remain absent. Mobile contracts
must be synchronized with its explicit DTOs and `/api/v1` conventions rather than inferred.

Registration, phone/email code verification, resend, consent persistence, challenge delivery records,
and access-token expiry metadata were added in migration `20260716180000_account_verification`.
Production SMS and email delivery remain external deployment blockers; development uses providers
that accept delivery without logging or persisting raw codes.

Welcome and Introduction require no backend capability: both are static release-managed content.
Adding endpoints, tables, audit events, or seed records for them would create needless dynamic state.

## Contract required for every dynamic capability

Document method/path, request and response schemas, stable IDs, authentication, role/permission,
organization/branch scope, field validation, status transitions, cursor pagination, search/filter/
sort, error codes and safe messages, rate limits, idempotency, audit entries, notification/webhook
side effects, database models, retention, and development seed scenario. Provide OpenAPI plus example
success, empty, validation, forbidden, conflict, rate-limit, server, and maintenance responses.

## Capability matrix

| Capability            | Operations required                                                  | Critical contract questions                                           |
| --------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Session/auth          | register, login, refresh/rotate, logout, logout-all, blocked status  | token TTL/storage, device sessions, one-flight retry, revocation      |
| Verification/recovery | send/resend/verify phone/email/reset tokens                          | expiry, attempts, cooldown, enumeration protection, link scheme       |
| Onboarding/KYC        | profile, status, document upload, submit/remediate                   | provider, levels, required fields/files, retention, review statuses   |
| Banks                 | bank list, resolve name, link/unlink, list                           | provider, ownership match, cache, limits, payout eligibility          |
| Dashboard             | balances, upcoming activity, previews                                | composed vs parallel, freshness and partial failure                   |
| Ajo                   | list/detail/create/update/join/invite/members/rotation/contributions | roles, cadence, slot/rotation, capacity, missed payment, payout/audit |
| Food plans            | list/detail/enroll/progress/contributions/distribution               | product/legal model, capacity, substitutions, refund/fulfillment      |
| Akawo goals           | list/detail/create/update/contribute/withdraw/history/mandate        | locked rules, automation, edits, completion, ledger                   |
| Wallet/ledger         | balances, fund/send/withdraw, status, fees/limits                    | rails, beneficiary, PIN/OTP, authoritative ledger, reconciliation     |
| Transactions          | cursor list/detail/receipt                                           | state machine, reversals, filters, immutable audit fields             |
| Notifications         | device register/unregister, list/read/preferences                    | payload schema, categories/channels, security, expiry/deep link       |
| Profile/support       | profile/referral/fees/support/security preferences                   | editable fields, referral rules, provider/SLA, account deletion       |

Financial create/confirm operations require a client-supplied idempotency key whose result can be
queried after timeout. Never return a success before the authoritative ledger transition. All money
uses integer minor units plus ISO currency; all timestamps are ISO 8601 UTC plus explicit business
timezone/cadence semantics. Cursor pagination returns next cursor and stable ordering.

## Database and side effects

Expected domain concepts—not schema prescriptions—include user/session/verification, profile/KYC
case/document, bank destination, Ajo group/membership/rotation/contribution/payout, food package/
enrollment/distribution, Akawo goal/schedule/contribution, wallet/ledger transaction/payment attempt,
notification/device/preference, role/permission, audit event, and idempotency record. Backend owners
must define invariants and migrations. Push/email/SMS/webhook side effects require deduplication,
traceability, safe payloads, and retry/dead-letter behavior.
