# Error Handling

## How errors reach the member

Errors, warnings and successes are shown as toasts (`src/components/ui/app-toast.tsx`),
never as cards or red text in a screen. Every failed query and mutation is toasted by the query
cache (`src/providers/query-toasts.ts`); a load failure offers "Try again". Declare what a query or
mutation says with `meta`: `errorTitle` for the heading, `successMessage` for a success toast, or
`toast: false` when the screen presents the failure as its content. For a message a screen works
out itself, use `useErrorToast`, `useWarningToast` or `useSuccessToast`
(`src/hooks/use-toast-on-change.ts`). Field validation stays under its field, and confirmations
stay dialogs. See `docs/DECISIONS.md`.

## Policy

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
