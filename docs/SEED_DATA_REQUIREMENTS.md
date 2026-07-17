# Development Seed Data Requirements

## Initialization scenarios

Retain safe accounts for `ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED`, and `DEACTIVATED` routing
tests, plus users with/without organization and branch assignments when that contract exists. Tokens
are never seeded or committed. Welcome/legal screens require no seed records.

Home requires an active user with zero and multiple wallets, no groups and multiple group
memberships, and eventually populated/empty/upcoming/overdue activity and Akawo scenarios. Amounts
must be realistic integer minor units and ledger-backed; seed data must never substitute for missing
production APIs.

Seed data belongs in the backend repository once identified. It must be deterministic, resettable,
clearly synthetic, safe to share, and aligned to approved contracts. Never use real PII, tokens,
bank credentials, identity documents, or payment instruments.

Provide named test personas for: verified standard member; unverified email; partial onboarding
at each guard; active/inactive/blocked account; empty new user; user with full history; Ajo admin;
ordinary member; invited/non-member; permission-restricted user; and, only if confirmed, organization
and branch roles with one/multiple/no selections.

Provide scenarios for multiple organizations/branches if the backend confirms them; active, pending,
full and completed Ajo groups; weekly/monthly cadences; rotations with received/current/upcoming
positions; one and multiple slots; upcoming/paid/overdue/failed contributions; ready/completed/failed
payouts; joined/discover/full food packages and distributions; active/pending/completed/locked/flexible
Akawo goals; upcoming/successful/failed automated contributions; zero/positive/restricted wallets;
pending/completed/failed/reversed transactions and payments; unread/read/deep-linked notifications;
linked/unverified banks; KYC pending/approved/rejected/remediation; expired invite/OTP/reset links;
conflict/rate-limit/maintenance fixtures.

Each dynamic screen needs populated, empty, partial, large paginated, stale-compatible, unauthorized,
not-found, validation, conflict, and server-failure fixtures. Financial fixtures must reconcile to
ledger balances and exercise duplicate idempotency keys. Provide safe upload fixtures at valid,
oversized, unsupported, and corrupted boundaries. Publish reset commands and stable persona IDs for
component/integration/E2E automation.

Welcome and Introduction have no seed requirements because they contain no user-specific or mutable
server data. Their complete states are exercised with local component tests and an isolated
AsyncStorage mock. Auth personas become required when registration/sign-in is implemented.

The backend seed now includes an active verified admin and email-pending user (`222222` in isolated
development/test data). The challenge ID is stable, codes are stored only as peppered HMAC digests,
expiry is deterministic, and the seed remains gated
by `ALLOW_SEED=true` outside production. It also includes a balanced posted NGN wallet opening
transaction, an active target Akawo goal, and a pending future savings schedule for the verified
admin. Database execution still requires an available configured PostgreSQL service.
