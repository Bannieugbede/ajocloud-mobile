# Design Reference Audit

## Launch and public-entry mapping (2026-07-16)

- `web-design/src/app/components/AuthFlow.tsx` `SplashScreen` supplies centered brand hierarchy and
  immediate transition intent. Native implementation uses the Expo splash and real initialization.
- Its `WelcomeScreen` supplies brand visual → headline/copy → actions. Mobile retains that order,
  adds requested benefit indicators and Terms/Privacy destinations, and translates green/gold to
  semantic blue/teal tokens.
- The prototype has no legal views. Native legal routes inherit its card, spacing, hierarchy, and
  status conventions. Approved copy is not invented; an unavailable state is shown until supplied.

## Authenticated tabs and Home mapping (2026-07-16)

- `web-design/src/app/App.tsx` `NAV_ITEMS` maps to native tabs in the corrected order: Home, Ajo,
  Food, Akawo, Profile. The reference's custom bottom bar and incorrect terminology are not copied.
- `App.tsx` `HomeScreen` establishes greeting → wallet → upcoming activity → Ajo groups → savings
  goals. Native Home retains that order, uses official theme tokens, native scrolling and controls,
  and replaces prototype financial values with live data or explicit unavailable states.

## Purpose and constraints

`/web-design` is a Figmake browser prototype used only to discover content hierarchy, flows,
repeated structures, fields, and states. Its React DOM, Tailwind, Radix/shadcn components, Lucide web
usage, fixed 393×852 phone frame, fake status/home indicators, simulated navigation, hardcoded data,
web modals, hover/active classes, CSS theme, green/gold palette, and DM Mono typography are not
mobile implementation assets. Do not edit or import it. Mobile work uses React Native controls,
native Stack headers/tabs/modals, device safe areas, Poppins, and the blue/teal theme.

The reference contains the incorrect label `Akawa`; all mobile routes, types, docs, API labels, tests,
and copy translate it to `Akawo`. The reference is excluded from automated validation because it is
an immutable record of the source artifact.

## Audit findings

The prototype is two orchestrators rather than real routes: `AuthFlow.tsx` switches 19 auth/setup
states, while `App.tsx` switches five tabs and inline detail/create/join states. It models one general
member persona and does not demonstrate organization/branch administration, approval roles,
authoritative payment states, empty/error/loading/offline states, notification center, transaction
detail, wallet action flows, settings detail, legal pages, or support conversations. All dates and
money are hardcoded. Native translation therefore separates inline detail panels into Stack routes,
browser overlays into native modals/sheets only when appropriate, horizontal web areas into native
lists, and the five-item reference navigation into a product-review candidate rather than a final
decision.

## Mapping

| Web file/state          | Mobile screen             | Proposed Expo route              | Native pattern / reusable components      | Data               | Backend         | Phase |
| ----------------------- | ------------------------- | -------------------------------- | ----------------------------------------- | ------------------ | --------------- | ----- |
| `AuthFlow:splash`       | Launch gate               | `/`                              | native splash + route resolver            | local              | session refresh | 3     |
| `welcome`               | Welcome                   | `/(auth)/welcome`                | Stack, AppButton                          | static             | none            | 4     |
| `onboarding` (3 slides) | Retired reference state   | —                                | Not shipped; Welcome routes to auth entry | none               | none            | 4     |
| `signup`                | Register                  | `/(auth)/register`               | keyboard screen, form fields              | dynamic            | auth create     | 4     |
| `otp-phone`             | Retired reference state   | —                                | Not shipped; email verification owns OTP  | none               | none            | 4     |
| `email-verify`          | Email verification        | `/(auth)/verify-email`           | OTP/link state                            | user-specific      | verification    | 4     |
| `signin`                | Sign in                   | `/(auth)/sign-in`                | password form                             | dynamic            | auth            | 4     |
| `forgot`                | Request reset             | `/(auth)/forgot-password`        | identifier form                           | dynamic            | recovery        | 4     |
| `forgot-otp`            | Verify reset code         | `/(auth)/verify-reset`           | OTP form                                  | dynamic            | recovery        | 4     |
| `new-password`          | Set new password          | `/(auth)/reset-password`         | password form                             | dynamic            | recovery        | 4     |
| `pwd-done`              | Reset complete            | `/(auth)/reset-complete`         | success state                             | static transition  | none            | 4     |
| `pin-create`            | Create transaction PIN    | `/(onboarding)/transaction-pin`  | secure PIN form                           | user-specific      | PIN setup       | 4     |
| `biometrics`            | Biometric preference      | `/(onboarding)/biometrics`       | LocalAuthentication prompt                | local/user         | optional policy | 4     |
| `kyc-intro`             | Verification introduction | `/(onboarding)/kyc`              | static explanation                        | static             | none            | 4     |
| `personal`              | Personal details          | `/(onboarding)/personal-details` | validated form                            | user-specific      | KYC profile     | 4     |
| `identity`              | Identity document         | `/(onboarding)/identity`         | picker/camera upload                      | user-specific      | KYC/upload      | 4     |
| `bank` + picker         | Bank account              | `/(onboarding)/bank-account`     | form + native modal picker                | user-specific      | bank verify     | 4     |
| `interests`             | Interests                 | `/(onboarding)/interests`        | selectable cards                          | local then dynamic | preference save | 4     |
| `done`                  | Setup complete            | `/(onboarding)/complete`         | success summary                           | user-specific      | profile read    | 4     |
| `HomeScreen`            | Home dashboard            | `/(tabs)/home`                   | native tab/Stack, summary cards           | user-specific      | dashboard       | 5     |
| `AjoScreen`             | Ajo groups                | `/(tabs)/ajo`                    | paginated list, search/filter             | dynamic            | groups list     | 6     |
| `AjoGroupDetail`        | Ajo group detail          | `/ajo/[groupId]`                 | Stack detail, member rotation list        | dynamic            | group/detail    | 6     |
| Ajo join overlay        | Join Ajo group            | `/(modals)/join-ajo`             | native modal confirmation/form            | dynamic            | join mutation   | 6     |
| `FoodScreen`            | Food packages             | `/(tabs)/food`                   | paginated list/filter                     | dynamic            | packages list   | 7     |
| `FoodPackageDetail`     | Food package detail       | `/food/[packageId]`              | Stack detail                              | dynamic            | package/detail  | 7     |
| Food join overlay       | Join food package         | `/(modals)/join-food`            | native modal confirmation                 | dynamic            | join mutation   | 7     |
| `AkawaScreen`           | Akawo goals               | `/(tabs)/akawo`                  | list + goal cards                         | user-specific      | goals list      | 8     |
| Akawo create overlay    | Create Akawo goal         | `/(modals)/create-akawo`         | validated keyboard modal                  | user-specific      | goal create     | 8     |
| `ProfileScreen`         | Profile hub               | `/(tabs)/profile`                | profile summary + native list rows        | user-specific      | profile/wallet  | 10    |

Detailed states and delivery criteria are in `SCREEN_INVENTORY.md` and `ROADMAP.md`.

## Clarifications needed

- Is “Food” a savings product, commerce fulfillment product, or both, and who coordinates it?
- Are users scoped to organizations/branches, despite those concepts not appearing in the prototype?
- Which roles can create/manage Ajo groups, change rotation, approve members, or release payouts?
- What are the transaction PIN protocol, KYC provider/statuses, bank verification provider, fees,
  contribution cadence rules, missed-payment rules, payout disputes, refunds, and ledger semantics?
- Is the final main navigation five tabs, or should wallet/activity be promoted and profile nested?
- Which notifications, analytics provider/events, support channel, legal URLs, and deep links exist?

## 2026-07-16 native entry-screen translation

Welcome retains the reference hierarchy—brand visual, value statement, and account entry
actions—but uses the official blue/teal semantics and a native responsive illustration rather than
copied browser cards. The reference introduction carousel is intentionally retired; Create account
and Sign in now open their corresponding auth screens directly.

Registration and Sign-in retain the reference field hierarchy but use native keyboard-aware scrolling,
accessible inputs/switches, backend errors, and explicit loading states. Phone and email verification
share one native OTP composition with channel-specific copy, masked destinations, expiry, resend, and
delivery-failure states. No browser form, modal, icon, color, or fixed device frame was copied.
