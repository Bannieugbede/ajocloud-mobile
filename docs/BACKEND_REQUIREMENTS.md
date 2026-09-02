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

- Available/reserved wallet summary is implemented as posted-ledger minor-unit strings. Dedicated
  savings/reward account summaries remain required if those balances become separate products.
- Upcoming contribution, payout, food distribution, and Akawo schedule feed.
- Akawo goal summary/list/detail is implemented; contribution money movement is still absent.
- Unread notification count and guarded notification destinations.
- Owner-scoped recent wallet history is implemented. Idempotent funding, transfer, and withdrawal
  contracts remain required before Home quick actions can be enabled.

The sibling `ajocloud-backend` NestJS/Fastify/Prisma service was inspected on 2026-07-16. It exposes
versioned registration, login, rotating refresh, logout, and logout-all endpoints, but verification,
password recovery, device management, and full onboarding endpoints remain absent. Mobile contracts
must be synchronized with its explicit DTOs and `/api/v1` conventions rather than inferred.

Registration, email code verification, resend, consent persistence, challenge delivery records, and
access-token expiry metadata are implemented. Phone verification and its public endpoint have been
retired. Production email delivery remains an external deployment dependency; development providers
accept delivery without logging or persisting raw codes.

Welcome requires no backend capability because it is static release-managed content. Adding an
endpoint, table, audit event, or seed record for it would create needless dynamic state.

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
| Verification/recovery | send/resend/verify email/reset tokens                                | expiry, attempts, cooldown, enumeration protection, link scheme       |
| Onboarding/KYC        | profile, status, document upload, submit/remediate                   | provider, levels, required fields/files, retention, review statuses   |
| Banks                 | bank list, resolve name, link/unlink, list                           | provider, ownership match, cache, limits, payout eligibility          |
| Dashboard             | balances, upcoming activity, previews                                | composed vs parallel, freshness and partial failure                   |
| Ajo                   | list/detail/create/update/join/invite/members/rotation/contributions | roles, cadence, slot/rotation, capacity, missed payment, payout/audit |
| Food plans            | list/detail/enroll/progress/contributions/distribution               | product/legal model, capacity, substitutions, refund/fulfillment      |
| Akawo goals           | list/detail/create/update/contribute/withdraw/history/mandate        | locked rules, automation, edits, completion, ledger                   |
| Wallet/ledger         | summary/history ready; fund/send/withdraw still required             | rails, beneficiary, PIN/OTP, authoritative ledger, reconciliation     |
| Transactions          | recent list ready; cursor list/detail/receipt still required         | state machine, reversals, filters, immutable audit fields             |
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

## Account-creation step form (2026-08-19)

Delivered alongside the mobile step form. Already available:

| Endpoint                                   | Purpose                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/v1/auth/register`               | Now takes `phone` (E.164, required) and `referralCode` (optional). `acceptedTerms` was removed; only `acceptedPrivacy` is collected. |
| `POST /api/v1/auth/resend-verification`    | Backs the resend control on the email step.                                                                                          |
| `GET  /api/v1/auth/transaction-pin`        | Whether a PIN is set, and any active lockout.                                                                                        |
| `POST /api/v1/auth/transaction-pin`        | Sets or replaces the 4-digit PIN. Replacing requires `currentPin`.                                                                   |
| `POST /api/v1/auth/transaction-pin/verify` | Checks a PIN; locks after 5 consecutive failures for 15 minutes.                                                                     |

Identity verification (steps g-i) is now implemented. The data policy is settled in
`ajocloud-backend/docs/adr/ADR-004-identity-verification-provider-and-data-policy.md`.
**Monnify** is the single provider for payments, verification, and payouts
(`ADR-005-monnify-as-single-financial-and-identity-provider.md`); it supplies BVN/NIN
verification, the bank list, and account name inquiry. vNIN is not supported and is
refused rather than misrouted.

| Endpoint                             | Purpose                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `GET   /api/v1/kyc/status`           | What the user still owes, backing the step f introduction.                     |
| `PATCH /api/v1/kyc/personal-details` | Step g: dob, gender, address, city, state, occupation. Rejects under-18.       |
| `POST  /api/v1/kyc/identity`         | Step h: BVN/NIN plus explicit consent. Returns pass/fail and the masked value. |
| `GET   /api/v1/kyc/banks`            | Step i: provider bank list with NIP codes, cached 24h.                         |
| `POST  /api/v1/kyc/banks/inquire`    | Step i: resolves the account name. Stores nothing.                             |
| `POST  /api/v1/kyc/bank-accounts`    | Step i: links the account after the name is confirmed.                         |
| `GET   /api/v1/kyc/bank-accounts`    | Lists linked accounts, masked.                                                 |

Agreed constraint, now enforced and tested: the raw BVN/NIN is **never
persisted**. It is sent over TLS, verified with the provider, and only the
masked value (`*******1234`) plus the result and provider reference are stored,
per `ajocloud-backend/docs/kyc.md`. The mobile client holds the entered number
in component state for one submission and clears it as soon as the request
resolves; it is never written to the persisted registration store, to
SecureStore, to a route param, or to a log.

Note on terminology: true end-to-end encryption is not achievable for this
operation, because the server must send the plaintext identifier to Monnify — the
provider is the party performing the match. What is implemented is TLS in
transit plus strict non-persistence, which is the meaningful protection.

Rules that apply, from ADR-004:

- Name mismatch is **advisory**: it raises a `NAME_MISMATCH` risk flag and routes
  the profile to review, and never auto-rejects.
- Five failed identity checks per user per rolling 24 hours, then refusal plus
  compliance review.
- Tier 2 needs all three of personal details, a passed identity check, and a
  verified bank account.
- Tier 3 (face match, liveness) is still unimplemented and needs a further ADR,
  which must also establish whether Monnify can serve biometric checks at all.

Still deferred:

- Tier 3 biometric checks (face match, liveness).
- Compliance review tooling for profiles held at `REQUIRES_REVIEW`.

## Payments — delivered 2026-09-02

Implemented on the backend. See `docs/payments.md` and
`docs/adr/ADR-008-shared-payment-intents.md` in the backend repo. Every product
pays through this one contract rather than growing its own payment route.

| Endpoint                                    | Purpose                                                     |
| ------------------------------------------- | ----------------------------------------------------------- |
| `POST /api/v1/payments/intents`             | Creates an intent for a target. Requires `Idempotency-Key`. |
| `POST /api/v1/payments/intents/:id/confirm` | Method plus transaction PIN. Requires `Idempotency-Key`.    |
| `GET  /api/v1/payments/intents/:id`         | Polled while `PROCESSING`.                                  |
| `GET  /api/v1/wallets/me/balance`           | Available balance, to offer or grey out the wallet.         |

Client notes:

- The request body is flat (`targetType`, optional `targetId`) and carries **no
  amount**. The server resolves it from the target and re-checks it at
  settlement, so a stale or tampered amount is refused rather than paid.
- Status is `REQUIRES_CONFIRMATION` (not `REQUIRES_METHOD`), plus `PROCESSING`,
  `SUCCEEDED`, `FAILED`, `CANCELLED`.
- `transferInstructions` and `checkoutUrl` appear only on the confirm response,
  and only for that method. Transfer instructions include a `reference` the
  payer must quote — without it an incoming credit cannot be matched back.
- `feeMinor` is currently always `"0"`. The banded model is still undecided, so
  the field is real and displayed but charges nothing yet.

**What still does not work end to end:** a `TRANSFER` or `CARD` payment reaches
`PROCESSING` and stays there. Only a signature-verified Monnify webhook may
complete an external payment, and that handler is not written. Wallet payments
settle fully today, so the Akawo pool flow completes when the payer has a funded
wallet.

`AJO_CONTRIBUTION`, `FOOD_SUBSCRIPTION` and `WALLET_TOPUP` are refused with 422
until those products expose something payable.

## Akawo group pools

Implemented and in use — see `docs/akawo.md` in the backend repo. The mobile
client consumes every route. Two client-side notes:

- The plaintext `joinCode` is returned **only** by `POST /akawo/pools`. It cannot
  be fetched again, so the create flow must show it and offer sharing before the
  user leaves the screen.
- The organiser record is rendered to PDF on the client. The backend deliberately
  returns rows rather than a document.
