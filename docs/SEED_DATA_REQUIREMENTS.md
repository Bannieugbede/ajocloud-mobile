# Development Seed Data Requirements

Seed data belongs in the backend repository once identified. It must be deterministic, resettable,
clearly synthetic, safe to share, and aligned to approved contracts. Never use real PII, tokens,
bank credentials, identity documents, or payment instruments.

Provide named test personas for: verified standard member; unverified phone/email; partial onboarding
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
