# Deep Linking

Only the configured application scheme and approved universal/app-link HTTPS hosts are accepted.
Parse links into typed intents; never pass arbitrary paths directly to Router. Validate target type,
opaque ID, one-time token format, callback state/nonce, expiry, and allowlisted external return URL.

Startup stores one pending intent, restores/refreshes session, applies verification/onboarding/
organization/branch/role guards, and navigates only if authorized. Recovery and verification tokens
are consumed once and removed from navigation history. Payment callbacks reconcile status from the
backend rather than trusting query parameters. Unknown or unauthorized links show a safe native
error and route to the nearest valid home.

Test cold/warm/background launches, signed-out and wrong-role users, expired/replayed/malformed links,
redirect loops, deleted records, user switching, percent encoding, hostile hosts, payment state/nonce,
and notification payload equivalence.
