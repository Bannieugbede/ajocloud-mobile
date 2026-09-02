import { create } from 'zustand';

import type { PaymentIntentTarget } from '@/api/endpoints/payments';

/**
 * The hand-off between a feature and the shared payment screens.
 *
 * The payment routes are generic, so they need to know what is being paid for
 * and where to return afterwards. Passing that through URL params would put a
 * target's identifiers in navigation history; this keeps it in memory for the
 * duration of the flow instead.
 *
 * It holds no money and no PIN — only what to pay for and where to go next.
 */
export type PaymentRequest = {
  target: PaymentIntentTarget;
  /** Shown on the payment screens, e.g. the pool's name. */
  title: string;
  subtitle?: string;
  /** Where "Done" returns to. Navigated with replace, ending the payment flow. */
  returnTo: string;
};

type PaymentState = {
  request: PaymentRequest | null;
  start: (request: PaymentRequest) => void;
  clear: () => void;
};

export const usePaymentStore = create<PaymentState>((set) => ({
  request: null,
  start: (request) => set({ request }),
  clear: () => set({ request: null }),
}));
