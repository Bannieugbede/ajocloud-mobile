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

- Available/reserved wallet summary is implemented as posted-ledger minor-unit strings. The Home
  savings figure is summed client-side from live Akawo goals; a dedicated savings account summary
  is only required if savings becomes a separate balance rather than the sum of goals.
- Referral rewards are live: `GET /api/v1/referrals/me` returns the released reward total in minor
  units. Rewards are issued on a settled first deposit and reversed if that deposit reverses
  (backend ADR-012).
- Bill payment history now returns the biller and its category, which is what Quick Pay names.
  A saved-beneficiary API is still missing: Quick Pay is derived from history and cannot prefill a
  customer reference, so tapping one opens the bills home rather than resuming the exact payment.
- Upcoming contribution and payout activity is assembled client-side from `GET /ajo-groups`,
  `GET /ajo-groups/:id` and `GET /ajo-groups/:id/schedule`, one pair of requests per group and
  bounded to the first four. A composed dashboard feed would replace that fan-out.
- Month-over-month change on the wallet balance is missing. The 2026-09-11 hero design shows a
  growth pill ("+12.4% vs last month") beside the headline figure. Nothing returns a prior-period
  balance, so the pill is not built rather than filled with an invented percentage. It needs a
  prior-period closing balance, or the delta itself, on the wallet summary, with the period named
  and a defined answer for wallets younger than one period.
- Food distribution and Akawo schedule feeds remain outstanding.
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

## Food coordinator application (2026-09-07)

`POST /api/v1/food-coordinator-applications` takes four JSON columns that the
backend stores without validating their shape: `personalDetails`,
`businessDetails`, `operatingLocation`, `fulfilmentLocations`. Nothing server
side says what belongs in them, so the keys below are the client's contract with
whoever reviews an application. A client that invents its own keys produces
applications a reviewer cannot assess.

They are built by `src/features/food/coordinator-application-form.ts`:

| Column                | Keys                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `personalDetails`     | `businessContactName`, `contactPhone`                                                       |
| `businessDetails`     | `businessName`, `registrationNumber` — **omitted entirely** when neither is given           |
| `operatingLocation`   | `addressLine`, `city`, `state`                                                              |
| `fulfilmentLocations` | `method` (`PICKUP` \| `DELIVERY` \| `DELIVERY_OR_PICKUP`), `areas` when delivery is offered |

`businessContactName` follows the seed data, which already used that key.

An absent `businessDetails` means "applying as an individual". An empty object
would mean "a business whose details we failed to collect", which is a different
thing and would waste a reviewer's time.

### Settlement details are masked before they are sent

The column is `settlementAccountMasked` and there is no unmasked counterpart, so
the client masks to the last four digits (`******6789`) before the request is
built. The raw number never enters a request body, a log, or a retried mutation.

### Two calls, not one

`POST` creates a `DRAFT`; `POST /:id/submit` puts it into review. The client does
both in sequence because a member tapping "Submit application" means to apply —
but they stay separate calls, so a submit that fails leaves a recoverable draft
rather than losing five steps of typing.

### Not yet built

- **Resuming a draft.** `GET /me` returns applications but the mobile type keeps
  only `id`, `status`, `createdAt` and `submittedAt`, so a draft cannot be
  reloaded into the form. Someone whose submit fails currently starts again.
  Needs the list endpoint's fields carried through the client type, then
  `PATCH /:id` wired to the existing update endpoint.
- **Document upload.** `FoodCoordinatorDocument` exists in the schema, and the
  review flow expects documents, but there is no upload endpoint the client can
  call.
- **`MORE_INFORMATION_REQUIRED`.** The backend can ask for more information; the
  app has no screen that surfaces the request or lets someone respond.

## Food contributions and the payment schedule (2026-09-07)

The Food detail design shows a "Payment Schedule" tab and a "My Progress" bar at
60%. Neither can be built from what exists.

There is **no Food contribution model at all**: `prisma/models/food-ajo.prisma`
has `FoodAjoGroup`, `FoodPackage`, `FoodPackageItem`, `FoodSubscription`,
`FoodDistribution`, and the coordinator-application models — and nothing that
records a member paying anything. `FoodSubscription` carries `status`,
`quantity` and `fulfilmentMethod`; no amount, no schedule, no payments.

So a progress percentage would be a number nobody has computed, printed on a
screen about someone's money. The tab is built and states the enrolment terms
that _are_ known — package, portions, contribution amount and frequency,
fulfilment method, next distribution — and says plainly that individual payments
are not tracked yet.

What would be needed to build the design as drawn:

- A contribution schedule per subscription: how many instalments, of what
  amount, due when. `FoodAjoGroup` has `contributionMinor`,
  `contributionFrequency`, `startsAt` and `endsAt`, so the schedule is derivable
  — but derived on the client it would be a guess about money, and the backend
  is where that belongs.
- A payment record per instalment, posted through the ledger like every other
  contribution, so "paid" means an entry exists rather than a flag.
- `GET /api/v1/food-ajo/programmes/:programmeId/schedule` (or the rows on the
  subscription) returning both.

Until then the honest version ships. See `docs/DECISIONS.md`.

## Food Ajo product spec (2026-09-11)

A product brief was supplied covering discovery by location, vendor onboarding,
payment ticking, vendor wallets and a vendor registration fee. Most of it has no
backend behind it today. What follows is the contract the mobile client needs,
written so the backend team can build against it. Nothing in this section is
implemented on the client except where marked **built**.

### 1. Discovery — "food ajo closest to them"

`FoodAjoGroup` has no location at all. The coordinator's trading address is on
their _application_ (`operatingLocation`, free-form JSON), which is a different
record, not exposed on the programme, and not coordinates.

Required:

- Latitude/longitude on `FoodAjoGroup`, or a `FoodAjoLocation` relation when a
  programme serves several pickup points. Free-text address alone cannot answer
  "closest".
- `GET /api/v1/food-ajo/programmes?lat=&lng=&radiusKm=&sort=distance`, returning
  a `distanceKm` per item so the client displays the distance it sorted by
  rather than recomputing it.
- A defined answer for members who decline location permission. The client will
  fall back to unsorted browsing; it must not silently show an arbitrary order
  labelled "closest".
- Whether distance is to a pickup point or to the coordinator's base, since for
  a delivery programme those differ.

### 2. Packages and categories

Packages exist (`FoodPackage`, `FoodPackageItem`, with name, image, description,
price and items) and the client already lists them — **built**.

Missing: a _category_ for a package. The brief distinguishes "packages or
categories of food packages". Needs either a `category` field on `FoodPackage`
or a `FoodPackageCategory` model, plus whether categories are platform-defined
(a fixed list the client can group and filter by) or vendor-defined (free text,
groupable but not filterable across vendors). The client cannot choose this.

### 3. Payment routine and paying upfront

`contributionFrequency` (DAILY/WEEKLY/MONTHLY) and `contributionMinor` exist and
are displayed — **built**.

"Users can pay upfront at all time" is not buildable. There is no Food payment
model whatsoever (see the 2026-09-07 section above): no schedule, no instalment,
no payment record. Required before any of it ships:

- `FoodContributionSchedule` per subscription: instalment count, amount, due
  date, status.
- `FoodContribution` per payment, posted through the ledger, so "paid" means a
  ledger entry exists rather than a boolean somebody set.
- `POST /api/v1/food-ajo/subscriptions/:id/pay` taking an instalment id **or** a
  "pay the outstanding balance" intent, routed through the existing shared
  payment intent contract rather than a new payment path.
- Explicit rules for paying ahead: whether an upfront payment settles the next
  instalment, the whole schedule, or an arbitrary amount held as credit. Each
  produces a different receipt and a different refund story.

### 4. Payment ticking, both sides

"Automatically ticks for the user and the admin" needs no new client concept —
it is the schedule above, read by two audiences — but it does need:

- The member's own schedule on the subscription.
- A vendor-scoped view: `GET /api/v1/food-ajo/programmes/:id/subscribers`
  returning each member, their package, amount paid to date and outstanding
  balance. This is the "both user and vendor can see the total amount paid by a
  particular user" requirement, and it is the only endpoint that satisfies it.
- Authorization: the vendor sees their own programme's subscribers and nobody
  else's. A member sees only themselves.

### 5. Vendor wallet

"Money goes to the vendor wallet" is a settlement decision the client cannot
make. `Wallet` exists and coordinators have settlement bank details on their
application, which implies payout to a bank, not a wallet balance.

The backend must decide and document: does a Food payment credit the
coordinator's in-app `Wallet` immediately, or accrue and settle to the bank
account on a schedule? Whether funds are held until distribution is confirmed
matters most — releasing a member's money before their food arrives makes a
dispute unrecoverable. The client shows whatever the ledger reports; it must not
invent a "vendor balance" of its own.

### 6. Vendor registration fee — ₦1,000

Charged **on approval, before the vendor's first programme can be published**
(product decision, 2026-09-11). Applying stays free, so a rejected applicant is
never charged and no refund path is needed.

- Seed a `FeeDefinition`: code `FOOD_VENDOR_REGISTRATION`, `calculationType`
  FLAT, `amountMinor` `"100000"`, currency NGN, `payerType` coordinator,
  `chargeEvent` on coordinator approval, `refundable` false. It belongs in the
  existing fee engine, versioned and seeded — never a constant in the app, which
  would put the price of a thing in a build artefact.
- The approval transition should leave the vendor in a state the client can
  read: approved, fee outstanding. Needs a status or a flag distinguishing
  "approved" from "approved and paid", plus an endpoint to pay it through the
  shared payment intent contract (a `FOOD_VENDOR_REGISTRATION` target).
- Confirm whether an unpaid vendor may create a DRAFT programme and merely not
  publish it, or cannot create one at all.

### 7. WhatsApp contact — partly built

The client now collects a WhatsApp number on the coordinator application and
sends it as `personalDetails.whatsappPhone` — **built**. It is not yet on the
programme, so a member browsing cannot message a vendor.

Needs `whatsappPhone` surfaced on `FoodProgramme` (from the approved
application, or its own field if a vendor runs programmes on different lines).
The client will open `https://wa.me/<international format>`; the number must be
stored or returned in a form that converts, and the deep link validated like
every other external URL.

### 8. Vendor identity — partly built

The application collects CAC (`businessDetails.registrationNumber`) and now NIN
(`personalDetails.ninMasked`, masked to the last four digits like the settlement
account) — **built**, on the either/or rule that a registered business gives CAC
and an individual gives NIN.

The masked NIN is enough for a reviewer to recognise, not to verify. Real
verification needs the identity flow that already exists for members
(`IdentityKind` NIN/VNIN in KYC) applied to coordinator applications, which
would replace the typed number with a verification reference — the application
already has `identityVerificationRef` and `identityVerifiedAt` columns waiting
for exactly that.
