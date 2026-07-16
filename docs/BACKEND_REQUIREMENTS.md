# Backend Requirements

No backend, OpenAPI document, sibling repository, or API contract was available during audit. The
mobile client must not invent one. The endpoint names below are capability placeholders for backend
planning, not approved URLs or payloads.

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
