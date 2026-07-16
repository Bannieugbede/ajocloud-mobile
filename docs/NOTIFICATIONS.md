# Notifications

Ask permission only after an in-app explanation and only when notifications provide concrete value.
Register the Expo/native push token with backend installation ID, authenticated user, platform, app
version, locale, and safe capabilities; unregister on logout/account change and rotate when the token
changes. Android channels separate security, payment, contribution, payout, fulfillment, and general
updates according to product policy.

Payloads contain an opaque notification ID, category, target type/ID, issued/expiry time, and no PII,
balance, OTP, token, or sensitive free text. The app validates category, expiry, identifier, session,
role, and permission before navigation. Foreground display avoids duplicate in-app feedback. A tap is
held through startup/session restoration and then resolved by the same allowlisted deep-link router.

Backend requirements include device lifecycle, preferences, list/read state, deduplication, retries,
audit/trace IDs, and disabled/blocked account behavior. Tests cover permission granted/denied,
foreground/background/terminated delivery, duplicate/stale/malformed/unauthorized payloads, logout,
user switching, and deleted target records.
