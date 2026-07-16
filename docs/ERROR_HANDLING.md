# Error Handling

Transport and backend failures normalize to `AppError`; UI never branches on arbitrary response
strings. Authentication errors trigger the coordinated refresh policy, authorization hides unsafe
actions and explains access, validation maps to fields, not-found distinguishes removed records,
conflict refreshes authoritative state, rate-limit honors retry-after, maintenance blocks unsafe
actions, and unknown/server errors expose safe retry plus trace ID.

First-load errors replace content; background refresh failures retain stale content with disclosure;
section failures do not erase successful dashboard sections. Mutations retain safe form values and
never blindly retry financial actions. An ambiguous financial timeout navigates to pending/reconcile,
not failure or success. Root render failures use the error boundary. Logs include category, release,
route, and opaque trace identifiers only after redaction.
