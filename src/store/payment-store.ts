import { create } from 'zustand';

import type { PaymentIntentTarget } from '@/api/endpoints/payments';

/**
 * The hand-off between a product and the shared payment screens.
 *
 * The payment routes are generic, so they need to know what is being paid for
 * and where to return afterwards. Passing that through URL params would put a
 * target's identifiers in navigation history; this keeps it in memory for the
 * duration of the flow instead.
 *
 * It holds no money and no PIN — only what to pay for and where to go next.
 * Products never write to it directly: they call `usePayment().start`.
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
  /**
   * Identifies one run of the flow. A new one is issued whenever a payment
   * starts, and the payment screen is keyed by it, so nothing from a previous
   * payment — least of all its idempotency key — survives into the next.
   */
  flowId: string;
  /**
   * The payment waiting on a top-up. When the wallet is short, the member adds
   * money first; this is what "Continue" returns them to once it arrives.
   */
  resume: PaymentRequest | null;
  start: (request: PaymentRequest) => void;
  /** Pauses the current payment and starts a top-up of `amountMinor` for it. */
  startTopUp: (amountMinor: string) => void;
  /** Returns to the payment the top-up was for. */
  resumePaused: () => void;
  clear: () => void;
};

let flowCounter = 0;
function nextFlowId(): string {
  flowCounter += 1;
  return `${Date.now().toString(36)}-${flowCounter}`;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  request: null,
  flowId: nextFlowId(),
  resume: null,
  start: (request) => set({ request, resume: null, flowId: nextFlowId() }),
  startTopUp: (amountMinor) => {
    const paused = get().request;
    if (!paused) return;
    set({
      resume: paused,
      flowId: nextFlowId(),
      request: {
        target: { kind: 'WALLET_TOPUP', amountMinor },
        title: 'Add money',
        subtitle: `So you can pay for ${paused.title}`,
        // Abandoning the top-up returns to where the paused payment began.
        returnTo: paused.returnTo,
      },
    });
  },
  resumePaused: () => {
    const paused = get().resume;
    if (!paused) return;
    set({ request: paused, resume: null, flowId: nextFlowId() });
  },
  clear: () => set({ request: null, resume: null }),
}));
