# Implementation Roadmap

Last audited: 2026-07-16. Status vocabulary: `NOT STARTED`, `READY`, `IN PROGRESS`, `BLOCKED`,
`IN REVIEW`, `COMPLETED`, `DEFERRED`. Percentages are checklist counts, not estimates of effort.
The screen-level purpose, route, roles, access, header/actions, classification, backend/database/seed
dependency, sections/components/forms/validation, states, offline/pagination/refresh, permissions,
analytics, notification/deep-link behavior, security, accessibility, tests, dependencies, status, and
definition of done are specified in `SCREEN_INVENTORY.md` and form part of this roadmap.

## Roadmap structure

Every delivery entry is organized as **phase → feature group → flow → screen**, with supporting
backend work, dependencies, status, and definition of done recorded here and in
`SCREEN_INVENTORY.md`. A visual prototype never satisfies a screen definition of done.

## Progress summary

| Phase                       | Checklist complete | Status      | Backend readiness       | Design readiness | Testing/docs           |
| --------------------------- | -----------------: | ----------- | ----------------------- | ---------------- | ---------------------- |
| 0 Audit                     |                8/8 | COMPLETED   | Not available           | Audited          | Recorded               |
| 1 Foundation                |              16/20 | IN PROGRESS | Client only             | N/A              | Initial tests/docs     |
| 2 Design system             |               7/18 | IN PROGRESS | N/A                     | Tokens ready     | Auth primitives tested |
| 3 Shell/navigation          |               7/15 | IN PROGRESS | Session/profile exists  | Five tabs ready  | Bootstrap tests        |
| 4 Auth/onboarding           |       1/18 screens | IN REVIEW   | Verification APIs added | 18/18 referenced | 4 screens in review    |
| 5 Home                      |                0/1 | IN PROGRESS | Partial live APIs       | Ready            | Screen tested          |
| 6 Ajo                       |                2/3 | IN PROGRESS | List/detail ready       | Ready            | List tested            |
| 7 Food plans                |                2/3 | IN PROGRESS | List/detail ready       | Ready            | List tested            |
| 8 Akawo                     |                2/3 | IN PROGRESS | Goals/progress ready    | Ready            | List behavior tested   |
| 9 Wallet/payments/activity  |              2/TBD | IN PROGRESS | Summary/history ready   | Partial          | Validation passed      |
| 10 Profile/settings/support |              0/TBD | BLOCKED     | Not supplied            | Partial          | Not started            |
| 11 Hardening/release        |               0/14 | NOT STARTED | Depends on all          | Depends on all   | Not started            |

The pre-auth Introduction is retired. Launch, Welcome/public legal, and four dynamic authentication
screens are in review.

## Phase 0 — Repository audit (COMPLETED)

- [x] Confirm Expo SDK 57.0.6, React Native 0.86, React 19.2.3, Router 57, strict TS, Bun lockfile.
- [x] Read exact SDK 57 reference and verify expected platform/Node versions.
- [x] Record existing root Stack, starter screen/hooks/theme, assets, environment absence, and no API.
- [x] Record no tests, formatter, complete lint config, backend, database, or native projects.
- [x] Preserve the user's dirty starter cleanup; do not restore intentionally deleted example code.
- [x] Inspect all custom reference application/auth files and discover 29 mapped states/views.
- [x] Locate incorrect terminology in the immutable reference and nowhere in mobile implementation.
- [x] Document missing flows, backend uncertainty, browser patterns, and theme conflict.

Completion: 2026-07-16. Files: `DESIGN_REFERENCE.md`, `SCREEN_INVENTORY.md`, this roadmap. Validation:
manual file/route/term audit. Limitation: no backend repository or contracts were available.

## Phase 1 — Project foundation (IN PROGRESS, priority P0)

Dependencies: none for local work; auth refresh and product API remain backend-blocked.

- [x] SDK-compatible Expo/device dependencies installed with Expo resolver; unused starter UI removed.
- [x] Strict TypeScript and path aliases retained.
- [x] Environment schema/example added; production policy still needs build profiles.
  - Local physical-device testing is configured through an ignored `.env.local` using the backend
    workstation's LAN origin; it must be refreshed when the network address changes.
- [x] Semantic light/dark theme and persisted System/Light/Dark preference.
- [x] Poppins 400/500/600/700 loading and splash coordination.
- [x] Query provider and Expo Network online manager.
- [x] Typed API request/error foundation, timeout/cancellation/idempotency hook.
- [x] Secure session storage primitive.
- [x] Root error boundary and safe fallback.
- [x] Native Stack/header and status bar theme sync.
- [x] ESLint, Prettier, Jest, strict typecheck, and combined scripts.
- [x] Automated terminology validator and test.
- [x] Environment, errors, theme, session, navigation, component tests.
- [x] `.env.example`, security/API/testing docs.
- [x] Minimal native foundation screen.
- [x] `npx expo install --check` clean after implementation.
- [ ] Implement coordinated access/refresh-token provider after contract.
- [ ] Add redacted production logging/reporting provider after vendor decision.
- [ ] Add EAS development/preview/production profiles and environment selection.
- [ ] Verify physical iOS/Android development and release builds.

Definition of done: all 20 checks, `bun run validate`, Expo Doctor, device launch, no secrets. Current
limitations are the four unchecked items. Main implementation files are under `src/theme`,
`src/providers`, `src/api`, `src/services`, and `src/app`; foundation tests are in `__tests__`.
Validation on 2026-07-16: combined validation passed; 7 suites/8 tests passed; Expo dependency check
was clean; Expo Doctor passed 20/20; production static web export generated all routes. Physical
iOS/Android development and release builds remain explicitly unchecked.

## Phase 2 — Native design system (IN PROGRESS, P0)

Build only as real screens demand each item: AppText [x], AppButton variants [x], IconButton [ ],
Input/TextArea [x], Password/OTP/PIN [x], FormField [x], Select [ ], Checkbox/Radio/Switch [x],
Card/ListItem/Divider [ ], Badge/Avatar [ ], Amount/Currency/Date [ ], Progress [ ], Search [ ],
Screen/Scroll/Keyboard/Refresh wrappers [x], Skeleton/Loading [ ], Empty/Error [ ], Alert/Modal [x],
Offline banner [ ], native header presets [ ], domain cards [ ]. Each requires both modes, dynamic
type, 48dp targets, accessible states, behavior tests, and documentation. Bottom sheets/toasts are
deferred until a concrete accessibility/product requirement justifies a dependency or internal build.

## Phase 3 — Navigation and app shell (IN PROGRESS, P0)

- [x] Root native Stack and shared theme-aware options.
- [x] Deterministic route-decision policy and initial unit test.
- [x] Splash waits for fonts, theme hydration, SecureStore session inspection, initial network state,
      optional update availability check, and route resolution without an arbitrary delay.
- [x] Create route groups only as first screens land: auth and tabs; modals remain demand-driven.
- [x] Native tabs confirmed in product order: Home, Ajo, Food, Akawo, Profile; each owns a nested Stack.
- [x] Restore unexpired SecureStore sessions, validate online sessions through `/users/me`, preserve
      a valid session during transient/offline startup, and clear expired/inactive sessions.
- [ ] One-flight refresh-token rotation before an expired access token is cleared.
- [ ] Auth, verification, onboarding, organization, branch, role, and permission guards.
- [ ] Native modal presentation and Android back behavior.
- [ ] Allowlisted deep-link parser and deferred navigation intent.
- [ ] Payment callback validation/reconciliation.
- [ ] Notification response routing.
- [ ] App-state/background query policy.
- [ ] Global offline/maintenance/session-expired presentation.
- [ ] Navigation integration tests for every guard edge and redirect loop.
- [ ] Platform/device verification.

## Phase 4 — Authentication and onboarding (IN REVIEW, P0)

### Feature group: public entry

Flow: Launch → Welcome → Register or Sign in; Welcome → Terms/Privacy.

- **Launch gate `/` — IN REVIEW.** Dependencies: fonts, theme persistence, SecureStore, Network,
  Updates, `/users/me`. Missing refresh and organization/branch context contracts are tracked in
  `BACKEND_REQUIREMENTS.md`. Definition of done includes every routing state, refresh, context
  restoration, release-build splash, and offline/device verification.
- **Welcome `/(auth)/welcome` — IN REVIEW.** Dependencies: Register, Sign in, public
  legal routes. Definition of done includes mapped hierarchy, every destination, approved legal
  content/fallback, themes, accessibility, and tests. Structure/routes are implemented; legal copy
  remains blocked.
- **Terms and Privacy `/(public)/legal/*` — BLOCKED.** Native unavailable states exist;
  release-approved documents and content ownership/version policy are missing.

Session 2026-07-16: Launch initialization + Welcome/public legal selected. Final status: `IN REVIEW`;
legal documents remain `BLOCKED`.

Sequence: Welcome → Register/Sign in; Register → Email verification → transaction
PIN → optional biometrics → KYC intro → personal details → identity →
bank → interests → setup complete. Recovery is Request reset → Verify reset → New password → Reset
complete. Implement one `SCREEN_INVENTORY.md` record per PR/task.

Registration, email OTP, and Sign-in now have native forms plus real NestJS/Prisma APIs, hashed
expiring challenges, cooldown/attempt limits, consent records, delivery/audit records, seeds,
SecureStore session writes, and behavioral tests. They remain **IN REVIEW** pending physical-device
verification, production email delivery, full refresh/guard routing, referral policy, and the
recovery destinations linked from Sign-in. Welcome remains **IN REVIEW** now that both direct
account-entry destinations exist. Required tests
include enumeration resistance, OTP expiry/resend/attempts, session storage/rotation, sensitive data
redaction, upload permissions, bank-resolution races, biometric fallback, and every guard transition.

Session 2026-07-16: Welcome + Introduction selected from `NOT STARTED` and implemented as static/local
screens without API, database migration, authorization, notification, or seed dependencies. This
session is superseded for Introduction by the 2026-07-18 product-direction change below.

Session 2026-07-17: Welcome and Introduction were made intentionally headerless. Shared themed Stack
options cover every nested navigation scene, and the native root background follows the resolved
theme so status/home-indicator edges and transitions do not expose a white fallback in dark mode.

Session 2026-07-18: The pre-auth Introduction was retired. Its route group, feature folder, local
completion preference, and tests were removed. Welcome now routes Create account and Sign in
directly to their auth screens, and the education action was removed.

Session 2026-07-16 (four-task override, superseded 2026-07-17): Registration, Phone verification,
Email verification, and Sign-in moved from `NOT STARTED` to `IN REVIEW`. The phone stage has since
been retired in favor of the email-only flow documented above.

Session 2026-07-17: Account creation now collects name, email, password, and consent, then routes
directly to one email OTP screen. The phone field, phone route, phone API call, and channel-selectable
resend behavior were removed. Successful email verification stores the session and opens Home.
Validation passed formatting, lint, strict typecheck, 14 suites/25 tests, and terminology checks.

Validation: mobile formatting, lint, strict typecheck, terminology, 10 suites/17 tests, and Expo
Doctor 20/20 passed. Backend Prisma validation/generation, formatting, lint, strict typecheck,
17 suites/53 unit tests, build, and 1 E2E test passed. Database migration/integration execution was
unavailable because PostgreSQL and `DATABASE_URL` were not available in this environment.

## Phase 5 — Home dashboard (BLOCKED, P1)

Session 2026-07-16: authenticated tab shell and Home dashboard foundation selected as two related
tasks. The shell moved to `IN REVIEW`; Home moved from `BLOCKED` to `IN PROGRESS`. Home follows the
reference order: greeting, wallet, upcoming activity, Ajo preview, Akawo preview. Profile, wallet
accounts, and Ajo groups use live existing APIs. Balance aggregation, upcoming activity, Akawo,
notifications, and financial mutations remain backend-blocked and are shown as explicit unavailable
states rather than prototype data.

Deliver Home only after authenticated shell and dashboard aggregation/caching strategy exist. Sections:
wallet with privacy toggle and fund/send/withdraw/history intents; upcoming due/payout activity; Ajo,
food, and Akawo previews. Decide composed endpoint versus parallel queries and partial-error behavior.
Seed populated, partial, zero-balance, empty, overdue, incoming payout, stale/offline, and restricted
wallet states. Definition of done is the Home record plus real routes, refresh, accessibility/tests.

## Phase 6 — Ajo groups (IN PROGRESS, P1)

Session 2026-07-16: implemented member-scoped native group list and detail routes using live
`GET /ajo-groups` and `GET /ajo-groups/:groupId` data, with loading/error/empty states, native stacks,
accessible cards, official themes, and behavioral tests. Join-code lookup, contribution
history/checkout, rotation schedule, and create/admin screens remain backend/product dependent.

Order: groups list → group detail → join/request modal → contribution checkout/history → admin/create
only if roles confirm it. Contracts must define cadence, slots/position, rotation mutability, capacity,
invites, approval, missed payments, payout state, fees, disputes, audit, notifications, pagination, and
idempotency. Seed active/full/completed/pending groups; member/non-member/admin; paid/due/overdue;
current/upcoming/received rotations; expired invite; permission denial. Reference screens: 0/3 done.

## Phase 7 — Food savings packages (IN PROGRESS, P1)

Session 2026-07-16: implemented authenticated Food programme list and native detail routes using the
cursor-ready programme APIs. Capacity, contribution cadence, fulfilment, package prices/items, and
price-lock state are live. Enrollment/payment remains visibly unavailable until subscription,
contribution, fee, and activation contracts are completed.

Order: package list → detail → enrollment/payment confirmation → progress/contribution/distribution
history. Confirm whether this is savings, commerce fulfillment, or both; item substitution, capacity,
coordinator verification, schedule, refund/cancellation, fulfillment evidence, and payment semantics.
Seed joined/discover/full/closed, monthly/term/one-time, upcoming/completed distribution, progress and
empty/error states. Reference screens: 0/3 done.

## Phase 8 — Akawo goals (IN PROGRESS, P1)

Session 2026-07-16: replaced the placeholder with live owner-scoped goal listing and detail routes,
total-saved/progress presentation, loading/empty states, and corrected Akawo terminology. Create form,
schedule setup UI, deposits, and withdrawals remain pending.

Validation: the complete mobile validation pipeline passed with 13 suites and 24 tests.

Order: goal list → create → detail → contribution/edit/withdraw only after rules exist. Confirm
locked/flexible semantics, early-withdrawal policy, automation mandate/provider, missed auto debit,
target/deadline edits, interest/rewards, completion, reminders, and ledger relationship. Seed empty,
active, achieved, locked, flexible, due, failed automation, partial history. Reference screens: 0/3.

## Phase 9 — Wallet, payments, transactions, withdrawals (IN PROGRESS, P0 security)

Session 2026-07-16: added authenticated wallet summary and recent-activity screen backed by derived
available/reserved ledger balances and existing ledger history. Funding, sending, and withdrawal
mutations remain blocked on provider and step-up authorization contracts.

Validation: formatting, lint, strict typecheck, 13 suites/24 tests, and terminology checks passed.

The reference only exposes entry points and summaries, so screen count/design readiness are unknown.
Define ledger/balance model; funding rails; beneficiary/account rules; fees/limits; PIN/OTP/biometric
step-up; payment callback and ambiguous result reconciliation; receipts; transaction status machine;
withdrawal review; reversals/refunds; webhooks/push; idempotency/audit. Then specify fund, send,
withdraw, payment source, confirmation, pending/result, transaction list/detail/receipt records.

## Phase 10 — Notifications, profile, settings, support (BLOCKED, P2)

Profile hub is mapped; detail destinations are incomplete. Specify/edit profile, KYC remediation,
bank accounts, referral, fees, support, security/password/PIN/biometric/sessions, notification
preferences, theme, legal, account deletion, and logout-all. Notification architecture requires
permission primer, device registration lifecycle, categories/channels, list/read state, preferences,
foreground policy, secure payloads, and guarded routing. Static legal/help content stays local only
when product/legal confirms release-managed content.

## Phase 11 — Hardening and release (NOT STARTED, P0 before production)

- [ ] Full validation and meaningful coverage baseline; critical E2E on iOS/Android.
- [ ] Accessibility audit with screen reader, large text, contrast, reduced motion, keyboard/switch.
- [ ] Performance profiling: startup, bundle, lists, images, low-memory/slow network.
- [ ] Offline/stale/restore/reconciliation and background/foreground testing.
- [ ] Security/threat review, dependency audit, secret scan, log/analytics redaction.
- [ ] Deep-link, notification, payment callback, malicious/stale payload testing.
- [ ] Permission strings, privacy manifests/policy, data retention/deletion review.
- [ ] Production API, certificates/network security, support/incident paths.
- [ ] EAS signing/build/update channels, runtime version and rollback policy.
- [ ] Store metadata, screenshots, privacy disclosures, age/content ratings.
- [ ] Release splash/icon/adaptive icon and dark/system UI verification.
- [ ] Backend migrations/seeds/monitoring/rate limits/idempotency ready.
- [ ] Staged rollout, crash/ANR/performance monitoring and rollback drill.
- [ ] `RELEASE_CHECKLIST.md` signed with known limitations and owners.

## Updating a completed item

Record completion date, implementation summary, main files, tests, exact validation results,
remaining limitations, follow-up work, backend/design/testing/documentation status. Change a screen to
`COMPLETED` only after its entire inventory contract is satisfied; otherwise keep it `IN PROGRESS`.
