# Testing Strategy

Jest with `jest-expo` and React Native Testing Library provides the current unit/component layer.
Tests assert behavior and accessibility, not implementation details or broad snapshots.

- Unit: theme resolution/tokens, Zod schemas, formatters, route decisions, query keys, permissions.
- Module integration: API adapters/error normalization, session restore, Zustand persistence,
  network decisions, notification/deep-link parsing.
- Component: roles, labels, states, form errors, presses, both themes, loading/empty/error content.
- Flow integration: auth/onboarding, guarded startup, contribution/payment confirmation, recovery.
- E2E (future): introduce Maestro or Detox after stable development-build identifiers and backend
  seed/reset tooling exist; run critical iOS/Android flows against an isolated test environment.

Foundation coverage includes theme selection and token parity, terminology enforcement, environment
validation, API error normalization, malformed session restoration, an accessible button, and a
navigation guard decision. New screens require happy path, loading, empty, error, offline, access,
validation, and retry tests where those states apply. Financial flows require duplicate-submission
and ambiguous-result tests. Notifications/deep links require malicious and stale payload tests.

Run `bun run test` locally and `bun run validate` before completion. A failed test must be fixed or
documented as a genuine external blocker; never weaken an assertion merely to pass CI. Coverage
thresholds will be introduced after the first real features establish a meaningful baseline.

Welcome tests cover all three accessible entry actions. Introduction tests cover forward paging,
completion, skip/error handling, and the AsyncStorage preference boundary. These tests use behavior
and accessible labels rather than snapshots.

Auth coverage now exercises required registration fields/consent, complete registration submission,
OTP paste and email verification, Sign-in submission, nested backend error normalization,
backend DTO validation, HMAC challenge binding, and destination masking.
