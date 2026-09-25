import { useEffect } from 'react';

import { toast, type ToastOptions } from '@/components/ui/app-toast';

/**
 * Raises an error toast each time `message` becomes a new, non-empty value.
 *
 * For errors a screen works out for itself, such as a document it will not
 * accept before sending anything. Failed requests need nothing: the query
 * cache toasts them already, and a screen passing the same message here as
 * well is harmless, since an identical toast on screen is only refreshed.
 */
export function useErrorToast(message: string | null | undefined, options?: ToastOptions): void {
  const title = options?.title;
  useEffect(() => {
    if (message) toast.error(message, title ? { title } : {});
  }, [message, title]);
}

/**
 * Raises a success toast when `done` turns true, as when a screen's `saved`
 * flag is set by a mutation that has just succeeded.
 */
export function useSuccessToast(done: boolean, message: string): void {
  useEffect(() => {
    if (done) toast.success(message);
  }, [done, message]);
}

/** Raises a warning toast when `active` turns true. */
export function useWarningToast(active: boolean, message: string): void {
  useEffect(() => {
    if (active) toast.warning(message);
  }, [active, message]);
}
