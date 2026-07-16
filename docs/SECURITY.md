# Security

## Threat model and controls

Assume a compromised device, hostile links, intercepted diagnostics, replayed requests, malicious
uploads, and unauthorized users discovering routes. Backend authentication and authorization are
mandatory for every protected record/action; hiding a control is only presentation.

- Keep tokens in SecureStore with device-only unlocked accessibility; clear them on logout and
  terminal refresh failure. AsyncStorage contains preferences only.
- Never ship private credentials in source, app config, assets, logs, analytics, or `EXPO_PUBLIC_`
  variables. Redact tokens, OTPs, PINs, passwords, PII, account/payment data, and full responses.
- Validate every deep link against scheme/host/path and expected parameters. Restore and authorize
  before navigating. Open external `https` URLs only from an allowlist and require confirmation for
  unexpected destinations.
- Validate form input on device for usability and again on the server for trust. Treat response text
  as data. Validate upload MIME, size, count, and purpose; the backend scans and revalidates.
- Use TLS, current OS baselines, request timeouts, and certificate/network configuration review
  before release. Certificate pinning is a separate operational decision because rotation failure
  can lock out every client.
- Financial writes require backend ledger rules, authorization, idempotency, replay prevention,
  audit logs, explicit final/pending/failed state, and no offline success simulation.
- A transaction PIN must be verified by the backend through an approved protocol and never logged
  or stored in plaintext. Biometrics only unlock locally stored session capability and always has a
  secure fallback.
- Request runtime permissions only in context after explaining value; handle denial and restricted
  state. Screenshot blocking is reserved for a documented high-risk screen and tested for UX impact.

Release review covers dependency advisories, secret scanning, deep links, permission declarations,
backup/storage behavior, production logging, API environment selection, session expiry/rotation,
and compromised/blocked-account behavior. Report suspected exposure immediately, revoke affected
credentials server-side, and publish a forced update only when proportionate.
