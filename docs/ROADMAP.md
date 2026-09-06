# Implementation Roadmap

Last audited: 2026-09-01. Status vocabulary: `NOT STARTED`, `READY`, `IN PROGRESS`, `BLOCKED`,
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

| Phase                       | Checklist complete | Status      | Backend readiness       | Design readiness | Testing/docs        |
| --------------------------- | -----------------: | ----------- | ----------------------- | ---------------- | ------------------- |
| 0 Audit                     |                8/8 | COMPLETED   | Not available           | Audited          | Recorded            |
| 1 Foundation                |              16/20 | IN PROGRESS | Client only             | N/A              | Initial tests/docs  |
| 2 Design system             |              16/19 | IN REVIEW   | N/A                     | Tokens ready     | 21 tests added      |
| 3 Shell/navigation          |               7/15 | IN PROGRESS | Session/profile exists  | Five tabs ready  | Bootstrap tests     |
| 4 Auth/onboarding           |       1/18 screens | IN REVIEW   | Verification APIs added | 18/18 referenced | 4 screens in review |
| 5 Home                      |                1/1 | COMPLETED   | Live APIs               | Ready            | 45 tests added      |
| 6 Ajo                       |                3/3 | IN REVIEW   | List/detail live        | Ready            | List/detail tested  |
| 7 Food plans                |                3/3 | IN REVIEW   | List/detail/plans live  | Ready            | 14 tests added      |
| 8 Akawo                     |              13/13 | IN REVIEW   | Pools redesigned        | Ready            | 72 tests added      |
| 9 Wallet/payments/activity  |              5/TBD | IN PROGRESS | Payment APIs missing    | Screens ready    | 8 tests added       |
| 10 Profile/settings/support |              0/TBD | BLOCKED     | Not supplied            | Partial          | Not started         |
| 11 Hardening/release        |               0/14 | NOT STARTED | Depends on all          | Depends on all   | Not started         |

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

## Phase 2 — Native design system (IN REVIEW, P0)

Build only as real screens demand each item: AppText [x], AppButton variants [x], IconButton [x],
Input/TextArea [x], Password/OTP/PIN [x], FormField [x], Select [x], Checkbox/Radio/Switch [x],
Card/ListItem/Divider [x], Badge/Avatar [x], Amount/Currency [x], Date [ ], Progress [x], Search [x],
Screen/Scroll/Keyboard/Refresh wrappers [x], Skeleton/Loading [x], Empty/Error [x], Alert/Modal [x],
Offline banner [x], native header presets [ ], domain cards [ ]. Each requires both modes, dynamic
type, 48dp targets, accessible states, behavior tests, and documentation. Bottom sheets/toasts are
deferred until a concrete accessibility/product requirement justifies a dependency or internal build.

Completed 2026-09-01. Summary: the card, status, empty, loading, error/retry and row patterns that
the product screens had each re-declared are now shared primitives, and the Ajo and Akawo list
screens consume them. Files: `src/components/ui/app-{amount,avatar,badge,card,divider,icon-button,
list-item,offline-banner,progress,search,skeleton,state}.tsx`, `src/hooks/use-online-status.ts`,
`src/utils/money.ts`, `src/features/ajo/ajo-list-screen.tsx`,
`src/features/akawo/akawo-list-screen.tsx`. Tests: `__tests__/ui-primitives.test.tsx` (15),
`__tests__/money.test.ts` (6). Validation on 2026-09-01: `bun run validate` passed — format, lint,
strict typecheck, 21 suites/90 tests, terminology.

Behavioural change worth noting: `formatMinorAmount` previously parsed minor units through
`Number()`, which rounds silently above 2^53 — reachable for a 1,000-member group pool, and the
Akawo screen already summed with `BigInt` to work around it. Formatting now stays in `BigInt` and
string space end to end. `sumMinorAmounts` was added for list and wallet totals.

Remaining in this phase: a Date/relative-time primitive (deferred until a screen shows real
schedule dates), native header presets, and domain cards. Both outstanding items depend on
Phase 3 header centralization and on the contribution/payout APIs that are still backend-blocked.

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

Session 2026-08-19: The Introduction was reinstated as a three-slide swipeable carousel at
`/(auth)/onboarding`, and the Welcome screen was deleted. The carousel is the signed-out entry point
on first install and after every sign-out; once completed or skipped it is replaced by Sign in.
Completion persists in the `ajo-cloud-onboarding` AsyncStorage flag, which sign-out resets. Slide
artwork is `react-native-svg` drawn from theme tokens, so no binary assets were added and both themes
work. Mobile now targets the production API via `EXPO_PUBLIC_API_BASE_URL=https://api.ajocloud.com`.
Status: Introduction `IN REVIEW`; device verification and end-to-end auth against production are
still outstanding because the production database is unreachable (`/health/ready` returns 503, so
every DB-backed auth endpoint returns 500). Validation: formatting, lint, and strict typecheck
passed; 34/35 tests passed, the single failure being the pre-existing terminology suite, which fails
identically on a clean tree because `rg` is absent from the Jest PATH.

Follow-ups requested 2026-08-19 (all `NOT STARTED`, Phase 4):

- [x] Google sign-in — IN REVIEW (2026-08-19). Implemented as the backend-owned browser redirect
      flow shared with web, using the existing `expo-web-browser` and `expo-linking` dependencies,
      so no new package was required. Needs device verification and real Google credentials.
- [x] Leading icons in every auth input — IN REVIEW (2026-08-19). `AppInput` gained `icon` and
      `action` slots; `FieldIcon` centralises the glyph choice. Icons are hidden from assistive
      technology because the field label already names the input.
- [x] Password reveal is an eye icon — IN REVIEW (2026-08-19). `PasswordInput` renders the toggle
      in the field's trailing slot with a 48dp target and a state-carrying label
      ("Show password"/"Hide password"), since the icon alone conveys state visually.
- [x] Forgotten-password flow — IN REVIEW (2026-08-19). `/(auth)/forgot-password` requests a code
      and `/(auth)/reset-password` verifies it and sets the new password, linked from Sign in.
      Backed by new `POST /auth/password-reset/{request,complete}` endpoints. Completing a reset
      revokes all sessions, so the flow ends at Sign in.
- [x] Auth stack headers — IN REVIEW (2026-08-19). Every auth screen shows the Ajo Cloud logo as
      its centred header title and an explicit back control, which hides itself on a root screen
      (`router.canGoBack()`); the introduction stays headerless.

Follow-ups requested 2026-08-19 (second batch):

- [x] Auth header back control did not work — IN REVIEW (2026-08-19). `BackButton` read
      `router.canGoBack()` once during render, in a component nothing re-renders on navigation, so
      the header kept whichever answer was true when the first screen mounted. It now subscribes to
      the navigation `state` event via `useNavigation()` and recomputes on every change.
- [x] "Forgot password?" moved inline with the password label — IN REVIEW (2026-08-19). `AppInput`
      gained a `labelAccessory` slot, so the link sits on the label row rather than in the footer.
- [x] Sign-up collects only the Privacy Policy, as a checkbox — IN REVIEW (2026-08-19). The Terms
      switch was removed from both the screen and the backend `RegisterDto`; the remaining consent
      uses the new `AppCheckbox` (role `checkbox`, 48dp row) rather than a `Switch`.
- [x] Account creation is a step form — IN REVIEW (2026-08-19). Steps a-e and k are complete:
      details (now with phone in international format and an optional referral code), email
      verification with resend, create PIN, confirm PIN, optional biometrics, and the closing
      "what would you like to do" picker. Progress is shown over the five core steps only.
      Step f ships as an introduction listing what identity verification needs, with a skip.
- [ ] Identity verification steps (g-i) — BLOCKED (2026-08-19) on a backend KYC ADR covering
      provider choice, required Tier 2 fields, the Nigerian bank list source, and account-name
      inquiry. Contracts are tracked in `docs/BACKEND_REQUIREMENTS.md`. Agreed constraint: the raw
      BVN/NIN is never persisted — only a masked value plus the result — per the backend KYC doc.
- [ ] Congratulations screen (step j) — NOT STARTED (2026-08-19). It is shown only when identity
      verification was completed, so it follows steps g-i.

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

Session 2026-08-19: replaced Expo starter branding with the supplied Ajo Cloud mark for the iOS
launcher icon, Android legacy/adaptive/themed icons, native splash, web favicon, and Welcome screen.
The release icon checklist remains open until preview/release builds are inspected on physical iOS
and Android devices, including Android mask shapes and themed icons. Validation passed formatting,
lint, strict type checking, 14 suites/24 tests, and terminology checks.

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

## Phase 8b — Akawo group pools (IN PROGRESS, P1)

Completed 2026-09-02. Ten screens covering both sides of a collection pool,
against the backend's `ADR-007` models.

Organiser: pools list, create, code-shown-once, manage (members, waive, remove,
open/close/cancel), and PDF export of the record.
Member: pools list, join by code with preview-before-commit, and the member view
with their own due.
Shared payment: method selection, PIN confirmation, and result — consumed by a
feature through `src/store/payment-store.ts`.

Files: `src/features/akawo/*`, `src/features/payments/*`,
`src/api/endpoints/{akawo-pools,payments}.ts`, `src/app/(tabs)/akawo/pools/*`,
`src/app/(tabs)/akawo/pay/*`. Tests: `__tests__/akawo-pools.test.tsx` (12),
`__tests__/payment-screens.test.tsx` (8). Validation on 2026-09-02:
`bun run validate` passed — 24 suites, 116 tests; `expo export --platform web`
resolved every route.

Navigation: push for reversible steps (opening a pool, starting a payment,
choosing a method); replace after creating a pool, joining one, and completing a
payment, so a back gesture cannot resubmit a form or re-authorise a payment.

### Redesign, 2026-09-06 (COMPLETED)

The five pool screens were rebuilt to the supplied designs. Both detail views
now share a `PoolHero` and switch between Overview and Members with
`AppSegmented`; the organiser's Members panel carries the Paid/Pending/
Processing tally and the PDF export; create gained a due-date picker and join a
preview lead-in.

New shared primitives: `AppSegmented`, `AppStatTiles`, `AppBadge` (extracted
from a private duplicate in `pool-card.tsx`), and an optional leading `icon` on
`AppButton`. New feature modules: `pool-hero.tsx`, `pool-member-row.tsx`,
`pool-status.ts`, `create-pool-form.ts`.

Two defects fixed on the way: pool deadlines were formatted in local time, so an
end-of-day UTC deadline read a day late everywhere east of Greenwich; and
`AppButton` lost its accessible name once its label was wrapped for the icon,
which would have left every button in the app unnamed.

Deviation from the mockups: the third members tile shows Processing, not
"Partial" — the API has no part-paid state and inventing one would misreport
what has been collected. See `docs/DECISIONS.md`.

Tests: `__tests__/akawo-pool-detail-screens.test.tsx` (10),
`src/features/akawo/pool-status.test.ts` (12),
`create-pool-form.test.ts` (10), plus 9 added to `pool-summary.test.ts`.
Validation on 2026-09-06: `bun run validate` passed — 66 suites, 753 tests.
Five mutations confirmed the new guards fail when broken.

Limitations: sharing from the manage screen omits the join code, because the
backend stores only a digest and cannot return the plaintext again. Not
exercised against a device.

**Update 2026-09-02 — the payment endpoints now exist.** All four are
implemented and the mobile client is aligned to the delivered shapes (a flat
request body, `REQUIRES_CONFIRMATION` rather than `REQUIRES_METHOD`, and a
transfer `reference` that is now displayed). A wallet payment completes end to
end: verified locally against a seeded due, with the balance falling by exactly
the amount and the due transitioning to `PAID`.

Still incomplete: a `TRANSFER` or `CARD` payment reaches `PROCESSING` and stops,
because the Monnify webhook that completes an external payment is not written,
and no Monnify credentials are configured. `feeMinor` is a real field returning
`"0"` until the banded fee model is decided.

## Ajo screens (2026-09-02)

The flagship product had a list and a read-only detail screen; every action was
missing. Now built:

| Screen          | Route                        | Notes                                                                                           |
| --------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Create group    | `/(tabs)/ajo/create`         | Four steps; the last is optional and uses backend defaults.                                     |
| Invitation      | `/(tabs)/ajo/invitation`     | The code is returned once and stored as a digest, so this screen is the only chance to copy it. |
| Join            | `/(tabs)/ajo/join`           | Group ID plus the invitation code; both are prefilled when reached from an invitation link.     |
| Invitation link | `/join/[code]`               | Where a shared link lands, signed in or not. Names the group before asking for an account.      |
| Group detail    | `/(tabs)/ajo/[groupId]`      | Rotation with names, the viewer's next contribution, and the lock action.                       |
| Swap positions  | `/(tabs)/ajo/[groupId]/swap` | Offers only positions the viewer holds, asks only for others'.                                  |

The payment flow moved from `/(tabs)/akawo/pay` to `/(tabs)/pay`: it is shared by
every product, and its "done" fallback pointed at the Akawo pool list regardless
of which feature started it.

Navigation: `push` for reversible steps; `replace` after creating a group (backing
into the form would create a second one) and after joining (backing into the code
form would offer to rejoin). A swap request uses `back`, because the group screen
it returns to is already in the stack and the request is only pending approval.

Verified against a local backend with two accounts: create, join by code, lock,
a two-cycle schedule, and a swap request all succeed. Role scoping confirmed —
an administrator's schedule carries every member's contribution rows, an ordinary
member's carries only their own.

Not yet built: Food subscription actions, bill payments, Akawo goal creation,
wallet fund/withdraw/send, and profile/settings.

## Bill payment screens (2026-09-02)

The bill-payments module was fully implemented on the backend with no mobile
screen at all. Now built:

| Screen     | Route                            | Notes                                                                        |
| ---------- | -------------------------------- | ---------------------------------------------------------------------------- |
| Categories | `/(tabs)/bills`                  | Categories plus the five most recent payments, so a receipt can be reopened. |
| Billers    | `/(tabs)/bills/[categoryId]`     | Products show their price: a fixed amount, a range, or "Any amount".         |
| Pay        | `/(tabs)/bills/[categoryId]/pay` | Check the number, confirm the name, then the amount.                         |
| Receipt    | `/(tabs)/bills/receipt`          | Polls only while the outcome can still change.                               |

Bills does **not** use the shared payment-intent flow. The backend's
`POST /bill-payments` takes a wallet and an amount directly and settles through
its own reserve-then-settle path, which is already implemented and tested; routing
it through payment intents would have meant backend work for no user-visible gain.

Order matters in the pay screen: the reference is validated with the provider
_before_ the amount is asked for. A payment quotes a validation bound to the exact
reference that expires after fifteen minutes, so validating last would routinely
produce a stale pair. Editing the reference clears the confirmation for the same
reason.

A fixed-amount product is displayed, not asked for — the backend refuses anything
but the exact figure — and `resolveAmountMinor` sends the biller's amount rather
than whatever is in the field, so a stale entry cannot submit a rejected figure.

`RECONCILIATION_REQUIRED` is presented as its own outcome, neither success nor
failure: the wallet was debited and the provider's result is unknown.

Verified against a local backend: categories, billers, validation, payment,
receipt, and the wallet balance falling by exactly the amount. The refusals the UI
guards against were confirmed to be real — wrong amount for a fixed product (422),
a reference that no longer matches its validation (422), a missing idempotency key
(400) — and a replayed key returns the original payment rather than charging twice.

Not yet built: Food subscription actions, Akawo goal creation, wallet
fund/withdraw/send, and profile/settings.

## Food, Akawo goals, wallet and profile (2026-09-02)

| Screen                                | Route                             |
| ------------------------------------- | --------------------------------- |
| Create a savings goal                 | `/(tabs)/akawo/create-goal`       |
| Join / leave a food programme         | `/(tabs)/food/[programmeId]`      |
| Send money                            | `/(tabs)/profile/wallet/send`     |
| Withdraw                              | `/(tabs)/profile/wallet/withdraw` |
| Profile menu, edit, security, support | `/(tabs)/profile/*`               |

Three of these needed backend routes that did not exist — food enrolment and
wallet send/withdraw — which are described in the backend repo's commit. Wallet
**funding** is still not possible: money enters a wallet through a payment rail
that is not wired up, so development balances are seeded instead.

A withdrawal reserves funds and stops at `PENDING`. The screens never say the
money has been sent, because an operator releases the payout.

`PATCH /users/me` returns the **profile alone**, not the whole user. Writing that
response into the `current-user` cache blanked the email and status across every
screen that read them; it is merged instead, and `mergeProfile` has a test.

A goal's kind changes what is asked for: a flexible goal has no target, and a
locked one needs a future date because it cannot be withdrawn from before it.

## Ajo swap approvals and notification preferences

Two surfaces that existed only as backend routes with nothing calling them.

| Screen        | Route                           | Notes                                               |
| ------------- | ------------------------------- | --------------------------------------------------- |
| Swap requests | `/(tabs)/ajo/[groupId]/swaps`   | Requests needing this member first, then history.   |
| Notifications | `/(tabs)/profile/notifications` | Per-topic email and SMS switches, plus quiet hours. |

Approve and reject already existed on the API and in the client, but nothing
listed a pending swap, so a request could only be acted on by someone who
already knew its id. The new `GET /ajo-groups/:groupId/swaps` returns
`awaitingMyDecision` per request; it is computed on the server because it
depends on who owns the two affected positions, and a client re-deriving it
could disagree with what the approve route will accept. The group screen shows
the count so a member does not have to open the screen to discover they are
being asked.

The buttons are withdrawn once a request's deadline passes, mirroring the server
rule rather than only checking status: the approve route refuses an expired
request, so offering the button would produce an error the member could not have
predicted. Approving is what rewrites the rotation, so the card says that in
words rather than only naming the two members.

Notification preferences cover product topics only. Security and
account-recovery messages — signing in, password changes, account locks — are
always sent and are deliberately absent from the screen, because a switch that
does nothing is worse than no switch; the screen says so at its foot instead of
leaving it to be inferred. Quiet hours are offered as presets, and the screen
shows "Off" rather than guessing when stored preferences disagree about the
window, since applying one row's window to everything on save would change
settings the person never touched.

## Push notifications, device registration, and the in-app inbox

| Screen        | Route                   | Notes                                 |
| ------------- | ----------------------- | ------------------------------------- |
| Notifications | `/(tabs)/notifications` | Grouped by day; reached from Profile. |

Every installation registers itself at sign-in. The call lives in `saveTokenPair`
rather than in each screen, because that is the one point every sign-in passes
through — password, OTP and Google alike — so no authentication path can forget
to announce the device. It is deliberately not awaited: a device that cannot be
registered right now still has a valid session, and blocking a sign-in on a push
token would make a slow network look like a failed login.

The device fingerprint is generated once and kept in SecureStore, not derived
from hardware identifiers: those are restricted on both platforms, change across
reinstalls anyway, and would make the record more identifying than it needs to
be. Losing it simply registers a new device, which is honest — the app really is
a fresh installation at that point.

Permission refusal and offline token fetches return null rather than throwing.
Being unreachable by push is an ordinary state, not an error, and the device is
still registered so it appears in the account's device list either way.

Per SDK 57: an Android channel is created before requesting a token, because
Android requires one to exist first; `projectId` is passed explicitly rather
than relying on manifest inference, which is absent in some build contexts; and
the handler returns `shouldShowBanner`/`shouldShowList` rather than the
deprecated `shouldShowAlert`.

A notification's deep link is checked before it is followed. The link arrives
from the server through Apple's and Google's infrastructure, so anything
carrying a scheme or falling outside the known tab prefixes is refused — an
unchecked server-supplied link is an open redirect.

The inbox is reached from Profile rather than a seventh tab, which would crowd
the bar without earning its place next to the products. Unread entries are
marked with a word as well as a dot, since status must never be carried by
colour alone.

Not yet built: Food coordinator tooling (creating programmes, procurement,
distribution) has no mobile surface — those routes exist on the backend but are
only reachable by API. Nothing yet emits product notifications either, so the
inbox is empty in practice until the domain events are wired.
