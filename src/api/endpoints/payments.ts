import { apiClient } from '@/api/client/api-client';

/**
 * The payment contract every feature pays through.
 *
 * None of these endpoints exist on the backend yet — wallets are read-only and
 * nothing moves money. The shapes are defined here so the payment screens are
 * real and typed, and so the required contract is one file rather than an
 * assumption spread across features. See docs/BACKEND_REQUIREMENTS.md.
 */

export type PaymentMethod = 'WALLET' | 'TRANSFER' | 'CARD';

/** What is being paid for. Adding a product means adding a variant here. */
export type PaymentIntentTarget =
  | { kind: 'AKAWO_POOL_DUE'; poolId: string; dueId: string }
  | { kind: 'AJO_CONTRIBUTION'; groupId: string; scheduleId: string }
  | { kind: 'FOOD_SUBSCRIPTION'; subscriptionId: string }
  | { kind: 'WALLET_TOPUP' };

export type PaymentIntent = {
  id: string;
  amountMinor: string;
  /** Platform fee, separate so the screen can show what is charged and why. */
  feeMinor: string;
  totalMinor: string;
  currency: string;
  status: 'REQUIRES_METHOD' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  /** Set for TRANSFER: the reserved account the user should send money to. */
  transferInstructions: {
    accountNumber: string;
    bankName: string;
    accountName: string;
    expiresAt: string;
  } | null;
  /** Set for CARD: the provider URL the user is sent to. */
  checkoutUrl: string | null;
  failureReason: string | null;
  createdAt: string;
};

export type WalletBalance = {
  availableMinor: string;
  currency: string;
};

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

/**
 * Creates an intent for a target. The amount comes from the server, not the
 * client, so a tampered request cannot underpay a due.
 *
 * `idempotencyKey` is required: a retried tap must not create a second payment.
 */
export function createPaymentIntent(
  target: PaymentIntentTarget,
  idempotencyKey: string,
): Promise<PaymentIntent> {
  return client().request('/api/v1/payments/intents', {
    method: 'POST',
    body: { target },
    idempotencyKey,
  });
}

/** Confirms an intent with a chosen method and the user's transaction PIN. */
export function confirmPaymentIntent(
  intentId: string,
  input: { method: PaymentMethod; transactionPin: string },
  idempotencyKey: string,
): Promise<PaymentIntent> {
  return client().request(`/api/v1/payments/intents/${encodeURIComponent(intentId)}/confirm`, {
    method: 'POST',
    body: input,
    idempotencyKey,
  });
}

/** Polled while an intent is PROCESSING, e.g. awaiting a transfer to land. */
export function getPaymentIntent(intentId: string): Promise<PaymentIntent> {
  return client().request(`/api/v1/payments/intents/${encodeURIComponent(intentId)}`);
}

export function getWalletBalance(): Promise<WalletBalance> {
  return client().request('/api/v1/wallets/me/balance');
}
